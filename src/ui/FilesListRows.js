import { createFileRow } from './FileRow.js'
import { renderList } from '../state/list.js'
import { t } from '../lang.js'

export function createFilesListRows(container, ctx) {
  const table = document.createElement('table')
  table.classList.add('fm-rows')

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  ;['', '', t('filename'), t('size'), ''].forEach(text => {
    const th = document.createElement('th')
    th.textContent = text
    headerRow.appendChild(th)
  })
  thead.appendChild(headerRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  table.appendChild(tbody)
  container.appendChild(table)

  const itemMap = new Map()

  return {
    element: table,
    update(files) {
      renderList(tbody, files, f => String(f.id), f => createFileRow(f, ctx), itemMap)
    },
    destroy() {
      for (const entry of itemMap.values()) entry.destroy()
      table.remove()
    },
  }
}
