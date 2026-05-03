import { useMutation } from '../query/index.js'
import { flash } from './flash.js'
import { t } from '../lang.js'
import { nestFolder } from '../functions/folders.js'

// Cache key helpers — string keys uniquely identify a query in QueryClient.
// Null/undefined IDs resolve to '' to represent the root level consistently.
export const filesQueryKey = (folderId) => `files/${folderId ?? ''}`
export const foldersQueryKey = (parentId) => `folders/${parentId ?? ''}`

// Optimistic delete: remove the file from cache immediately for instant UI feedback,
// then restore the snapshot if the server returns an error.
export async function removeFile(ctx, file) {
  const queryKey = filesQueryKey(file.folder)
  const oldData = ctx.queryClient.getQueryData(queryKey)
  if (oldData) {
    ctx.queryClient.setQueryData(queryKey, files => files ? files.filter(f => f.id !== file.id) : [])
  }
  try {
    await ctx.options.deleteFile(file)
  } catch (e) {
    flash(ctx, t('serverError'), 'danger')
    console.error(e)
    ctx.queryClient.setQueryData(queryKey, oldData)
  }
}

export async function uploadFile(ctx, file, folder) {
  try {
    const newFile = await ctx.options.uploadFile(file, folder)
    const queryKey = filesQueryKey(folder?.id)
    const state = ctx.queryClient.getQueryState(queryKey)
    // Only seed the cache if the file list for this folder has already been fetched.
    // Prepending avoids a redundant network request while still updating the UI instantly.
    if (state?.data) {
      ctx.queryClient.setQueryData(queryKey, files => files ? [newFile, ...files] : [newFile])
    }
  } catch (e) {
    flash(ctx, t('serverError'), 'danger')
    console.error(e)
  }
}

export function useCreateFolderMutation(ctx) {
  return useMutation(
    params => ctx.options.createFolder(params),
    {
      onSuccess(folder) {
        // Always seed the parent's cache so the children subscription fires immediately
        ctx.queryClient.setQueryData(
          foldersQueryKey(folder.parent),
          folders => folders ? [folder, ...folders] : [folder]
        )
      },
    }
  )
}

export function useRenameFolderMutation(ctx) {
  return useMutation(
    ({ folder, name }) => ctx.options.renameFolder(folder, name),
    {
      onSuccess(updatedFolder) {
        // A folder can appear in multiple cached lists (e.g. root list and nested parent).
        // Scan every 'folders/*' query in the cache and patch it wherever the ID matches.
        // String coercion handles numeric vs string ID mismatches that may come from the server.
        for (const [key, query] of ctx.queryClient.queries) {
          if (!key.startsWith('folders/')) continue
          const data = query.getData()
          if (data) {
            ctx.queryClient.setQueryData(key, folders =>
              folders.map(f => String(f.id) === String(updatedFolder.id) ? updatedFolder : f)
            )
          }
        }
        // Also update the active folder store and breadcrumb path if they point to this folder.
        if (String(ctx.folder.get()?.id) === String(updatedFolder.id)) {
          ctx.folder.set(updatedFolder)
        }
        ctx.folderPath.update(path =>
          path.map(f => f && String(f.id) === String(updatedFolder.id) ? updatedFolder : f)
        )
      },
    }
  )
}

export function useDeleteFolderMutation(ctx) {
  return useMutation(
    folder => ctx.options.deleteFolder(folder).then(() => folder),
    {
      onSuccess(folder) {
        // Reset navigation to root so no component is left pointing at the deleted folder.
        ctx.folder.set(null)
        ctx.folderPath.set([null])
        // Remove the folder from both its direct parent list and the root list —
        // it may have been cached under either key depending on the tree depth.
        const updateData = (parent) => {
          const queryKey = foldersQueryKey(parent)
          const state = ctx.queryClient.getQueryState(queryKey)
          if (state?.data) {
            ctx.queryClient.setQueryData(foldersQueryKey(parent), folders =>
              folders ? folders.filter(f => f.id !== folder.id) : []
            )
          }
        }
        updateData(folder.parent)
        updateData()
      },
    }
  )
}
