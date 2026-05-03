import { createSearch } from './Search.js'
import { createFolders } from './Folders.js'

// Sidebar: contains the search input and the folder tree rooted at [null] (root sentinel).
export function createSidebar(container, lazyFolders, ctx) {
  const aside = document.createElement('aside')
  aside.classList.add('fm-sidebar')
  container.appendChild(aside)

  const destroySearch = createSearch(aside, ctx)
  const folders = createFolders(aside, [null], lazyFolders, ctx)

  return () => {
    destroySearch()
    folders.destroy()
    aside.remove()
  }
}
