import { useQuery } from '../query/useQuery.js'
import { filesQueryKey, foldersQueryKey, useDeleteFolderMutation } from '../store/index.js'
import { createFilesListGrid } from './FilesListGrid.js'
import { createFilesListRows } from './FilesListRows.js'
import { iconLoader } from './icons/icons.js'
import { t } from '../lang.js'

// Orchestrates the files area for a single folder. Handles four states:
// loading, search-filtered list, file grid/rows, and empty state with optional delete.
export function createFilesList(container, folder, layout, ctx) {
  const el = document.createElement('div')
  el.style.cssText = 'width:100%;min-height:100%;display:flex;flex-direction:column;'
  container.appendChild(el)

  const unsubs = []
  let listComponent = null

  const filesQuery = useQuery(filesQueryKey(folder?.id), () => ctx.options.getFiles(folder), {}, ctx.queryClient)
  // foldersQuery is enabled: false — it reads from cache only (seeded by createFolder's onSuccess).
  // Used solely to decide whether the folder has sub-folders for the isEmpty check below.
  const foldersQuery = useQuery(foldersQueryKey(folder?.id), () => [], { enabled: false }, ctx.queryClient)
  const deleteFolder = useDeleteFolderMutation(ctx)

  function render(filesState) {
    // Search is applied client-side against the already-fetched list to avoid
    // a network request on every keystroke.
    const searchQuery = ctx.searchQuery.get()
    const files = filesState.isSuccess
      ? filesState.data.filter(f => searchQuery ? f.name.includes(searchQuery) : true)
      : []
    const foldersState = ctx.queryClient.getQueryState(foldersQueryKey(folder?.id))
    // A folder is deletable only when it has neither files nor sub-folders.
    // Check children from both the folder object (eager mode) and the query cache (lazy mode).
    const isEmpty = folder?.id &&
      filesState.isSuccess && filesState.data?.length === 0 &&
      ((folder?.children && folder.children.length === 0) ||
       (foldersState?.isSuccess && foldersState.data?.length === 0))

    if (listComponent) { listComponent.destroy(); listComponent = null }
    el.innerHTML = ''

    if (files.length > 0) {
      if (layout === 'rows') {
        listComponent = createFilesListRows(el, ctx)
      } else {
        listComponent = createFilesListGrid(el, ctx)
      }
      listComponent.update(files)
    } else if (filesState.isLoading) {
      const empty = document.createElement('div')
      empty.classList.add('fm-empty')
      const loader = iconLoader(40)
      empty.appendChild(loader)
      el.appendChild(empty)
    } else {
      const empty = document.createElement('div')
      empty.classList.add('fm-empty')

      const title = document.createElement('p')
      title.classList.add('fm-empty-title')
      title.textContent = t('emptyTitle')

      const desc = document.createElement('p')
      desc.textContent = t('emptyDescription')

      empty.appendChild(title)
      empty.appendChild(desc)

      if (isEmpty && !ctx.options.readOnly) {
        const deleteMutationState = deleteFolder.get()
        const deleteBtn = document.createElement('button')
        deleteBtn.classList.add('fm-delete-folder')
        deleteBtn.disabled = deleteMutationState.isLoading
        if (deleteMutationState.isLoading) {
          deleteBtn.appendChild(iconLoader(12))
        }
        deleteBtn.appendChild(document.createTextNode(t('deleteFolder')))
        deleteBtn.addEventListener('click', e => {
          e.preventDefault()
          if (folder) deleteFolder.get().mutate(folder)
        })
        empty.appendChild(deleteBtn)
      }

      el.appendChild(empty)
    }
  }

  unsubs.push(filesQuery.subscribe(render))
  unsubs.push(ctx.searchQuery.subscribe(() => render(filesQuery.get())))
  unsubs.push(deleteFolder.subscribe(() => render(filesQuery.get())))

  return () => {
    unsubs.forEach(u => u())
    if (listComponent) listComponent.destroy()
    el.remove()
  }
}
