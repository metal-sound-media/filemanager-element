import { createFileCell } from './FileCell.js'
import { renderList } from '../state/list.js'

export function createFilesListGrid(container, ctx) {
  const grid = document.createElement('div')
  grid.classList.add('fm-grid')
  container.appendChild(grid)

  const itemMap = new Map()

  return {
    element: grid,
    update(files) {
      renderList(grid, files, f => String(f.id), f => createFileCell(f, ctx), itemMap)
    },
    destroy() {
      for (const entry of itemMap.values()) entry.destroy()
      grid.remove()
    },
  }
}
