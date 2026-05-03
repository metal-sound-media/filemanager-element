import { createFolder } from './Folder.js'
import { renderList } from '../../state/list.js'

// Renders a keyed list of Folder items into a <ul>. Delegates DOM reconciliation
// to renderList so only changed items are created or destroyed on update.
export function createFolders(container, folders, lazyLoad, ctx) {
  const ul = document.createElement('ul')
  ul.classList.add('fm-folders')
  container.appendChild(ul)

  const itemMap = new Map()

  function update(newFolders) {
    renderList(
      ul,
      newFolders,
      f => String(f?.id ?? 'root'),
      f => createFolder(f, lazyLoad, ctx),
      itemMap
    )
  }

  update(folders)

  return {
    update,
    destroy() {
      for (const entry of itemMap.values()) entry.destroy()
      ul.remove()
    },
  }
}
