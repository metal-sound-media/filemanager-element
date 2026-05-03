import { iconLoader, iconFolder, iconCirclePlus } from '../icons/icons.js'
import { useQuery } from '../../query/useQuery.js'
import { foldersQueryKey, uploadFile } from '../../store/index.js'
import { dragOver } from '../../actions/dragOver.js'
import { tooltip } from '../../actions/tooltip.js'
import { nestFolder, buildFolderPath } from '../../functions/folders.js'
import { t } from '../../lang.js'
import { createNewFolder } from './NewFolder.js'
import { createFolders } from './Folders.js'

// Folder item: sidebar nav link, drag-and-drop upload target, and lazy-loadable
// tree node. Renders children recursively via createFolders and an inline new-folder form.

// String coercion so numeric and string IDs from the server compare correctly.
function isSameFolder(a, b) {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return String(a.id) === String(b.id)
}

export function createFolder(folder, lazyLoad, ctx) {
  let currentFolder = folder

  const li = document.createElement('li')
  const wrapper = document.createElement('span')
  wrapper.classList.add('fm-folder-wrapper')
  const span = document.createElement('span')
  span.classList.add('fm-folder')
  const nameSpan = document.createElement('span')
  nameSpan.classList.add('fm-folder-name')
  nameSpan.textContent = currentFolder?.name ?? '/'

  // over: true while a file is being dragged over this folder (for visual feedback).
  // addNewFolder: controls whether the inline new-folder form is shown.
  // showChildren: root folder starts expanded; named folders start collapsed.
  let over = false
  let addNewFolder = false
  let showChildren = !currentFolder?.id
  let childrenInstance = null
  let destroyNewFolder = null

  const iconSlot = document.createElement('span')
  span.appendChild(iconSlot)
  span.appendChild(nameSpan)
  wrapper.appendChild(span)

  const unsubs = []
  const cleanups = []

  // Active when selected OR when a file is dragged over it — drag hover is tracked
  // independently of selection so the drop target is highlighted without navigating.
  function updateActiveClass() {
    wrapper.classList.toggle('active', isSameFolder(currentFolder, ctx.folder.get()) || over)
  }

  unsubs.push(ctx.folder.subscribe(updateActiveClass))

  // Replace the folder icon with a spinner while child folders are being fetched.
  function renderIcon(isLoading) {
    iconSlot.innerHTML = ''
    iconSlot.appendChild(isLoading ? iconLoader(20, 'folder-loader') : iconFolder('folder-icon'))
  }
  renderIcon(false)

  if (!ctx.options.readOnly) {
    const newFolderBtn = document.createElement('button')
    newFolderBtn.classList.add('fm-new-folder')
    newFolderBtn.appendChild(iconCirclePlus(16))
    cleanups.push(tooltip(newFolderBtn, t('createFolder')))
    newFolderBtn.addEventListener('click', e => {
      e.preventDefault()
      addNewFolder = true
      showChildren = true
      if (!childrenQuery.get().isSuccess && !currentChildren) {
        childrenQuery.get().refetch()
      }
      renderForm()
    })
    wrapper.appendChild(newFolderBtn)
  }

  li.appendChild(wrapper)

  // Root folder fetches children immediately (enabled: true via !currentFolder?.id).
  // Named folders defer the fetch until the user expands them (enabled: false).
  const childrenQuery = useQuery(
    foldersQueryKey(currentFolder?.id),
    () => ctx.options.getFolders(currentFolder?.id ? currentFolder : undefined),
    { enabled: !currentFolder?.id },
    ctx.queryClient
  )

  let currentChildren = null

  unsubs.push(childrenQuery.subscribe(state => {
    renderIcon(state.isLoading)
    if (state.isSuccess) {
      // In eager (non-lazy, root) mode, folders arrive flat from the server and must be
      // nested here. In lazy mode they are already scoped to one parent by the API.
      currentChildren = (lazyLoad || !!currentFolder?.id
        ? state.data
        : nestFolder(state.data)
      ).filter(f => (f.parent ?? null) === (currentFolder?.id ?? null))
      if (showChildren) renderChildrenList()
    }
  }))

  // Create the children list on first expand, then call update() on subsequent renders
  // to patch only the changed items rather than rebuilding the entire DOM subtree.
  function renderChildrenList() {
    const children = currentChildren ?? currentFolder?.children
    if (!children || !showChildren) {
      if (childrenInstance) { childrenInstance.destroy(); childrenInstance = null }
      return
    }
    if (!childrenInstance) {
      childrenInstance = createFolders(li, children, lazyLoad, ctx)
    } else {
      childrenInstance.update(children)
    }
  }

  // Swap the new-folder form in/out by always destroying the previous instance first
  // so its cleanup callbacks (clickOutside, mutation subscription) run exactly once.
  function renderForm() {
    if (destroyNewFolder) { destroyNewFolder(); destroyNewFolder = null }
    if (!addNewFolder) return
    destroyNewFolder = createNewFolder(
      li,
      currentFolder,
      () => { addNewFolder = false; renderForm() },
      () => { addNewFolder = false; renderForm() },
      ctx
    )
  }

  const cleanupDragOver = dragOver(span)
  cleanups.push(cleanupDragOver)

  span.addEventListener('dropzoneover', () => {
    if (!ctx.options.readOnly) { over = true; updateActiveClass() }
  })
  span.addEventListener('dropzoneleave', () => {
    if (!ctx.options.readOnly) { over = false; updateActiveClass() }
  })
  span.addEventListener('drop', e => {
    if (ctx.options.readOnly) { e.preventDefault(); return }
    Array.from(e.dataTransfer.files).forEach(file => uploadFile(ctx, file, currentFolder))
  })

  // Clicking an already-selected, expanded folder collapses it.
  // Otherwise: expand, navigate to the folder, and trigger a child fetch if not yet loaded.
  span.addEventListener('click', e => {
    e.preventDefault()
    if (showChildren && isSameFolder(currentFolder, ctx.folder.get())) {
      showChildren = false
      if (childrenInstance) { childrenInstance.destroy(); childrenInstance = null }
      return
    }
    showChildren = true
    ctx.folder.set(currentFolder)
    ctx.folderPath.set(buildFolderPath(currentFolder, ctx.queryClient))
    if (!currentChildren) {
      childrenQuery.get().refetch()
    }
    if (currentChildren || currentFolder?.children) renderChildrenList()
  })

  if (showChildren && (currentChildren || currentFolder?.children)) renderChildrenList()

  return {
    element: li,
    update(newFolder) {
      currentFolder = newFolder
      nameSpan.textContent = currentFolder?.name ?? '/'
      updateActiveClass()
      if (showChildren) renderChildrenList()
    },
    destroy() {
      unsubs.forEach(u => u())
      cleanups.forEach(c => c())
      if (childrenInstance) childrenInstance.destroy()
      if (destroyNewFolder) destroyNewFolder()
      li.remove()
    },
  }
}
