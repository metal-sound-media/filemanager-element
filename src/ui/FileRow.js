import { iconDelete, iconCopy } from './icons/icons.js'
import { tooltip } from '../actions/tooltip.js'
import { useFileActions } from '../hooks/useFileActions.js'
import { shorten } from '../functions/string.js'
import { t } from '../lang.js'

// Table-row view for a single file: thumbnail, shortened name, formatted size,
// and action buttons (copy always shown; delete hidden in readOnly mode).
const sizeFormatter = new Intl.NumberFormat(undefined, {
  style: 'unit',
  unit: 'kilobyte',
  unitDisplay: 'short',
  maximumSignificantDigits: 3,
})

export function createFileRow(file, ctx) {
  const row = document.createElement('tr')
  row.setAttribute('data-file-id', String(file.id))

  const td1 = document.createElement('td')
  const td2 = document.createElement('td')
  const img = document.createElement('img')
  img.src = file.thumbnail
  img.alt = ''
  img.loading = 'lazy'
  td2.appendChild(img)

  const td3 = document.createElement('td')
  td3.classList.add('fm-row-filename')
  td3.textContent = shorten(file.name, 35)

  const td4 = document.createElement('td')
  td4.textContent = file.size ? sizeFormatter.format(file.size / 1000) : ''

  const td5 = document.createElement('td')
  td5.classList.add('fm-row-actions')

  const cleanups = []
  const actions = useFileActions(file, row, ctx)

  const copyBtn = document.createElement('button')
  copyBtn.appendChild(iconCopy())
  cleanups.push(tooltip(copyBtn, t('copy')))
  copyBtn.addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()
    actions.handleCopy()
  })
  td5.appendChild(copyBtn)

  if (!ctx.options.readOnly) {
    const deleteBtn = document.createElement('button')
    deleteBtn.appendChild(iconDelete())
    cleanups.push(tooltip(deleteBtn, t('delete')))
    deleteBtn.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      actions.handleDelete()
    })
    td5.appendChild(deleteBtn)
  }

  row.append(td1, td2, td3, td4, td5)
  row.addEventListener('click', actions.handleClick)

  return {
    element: row,
    destroy() { cleanups.forEach(c => c()) },
  }
}
