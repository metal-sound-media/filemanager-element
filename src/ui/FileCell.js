import { iconDelete } from './icons/icons.js'
import { tooltip } from '../actions/tooltip.js'
import { useFileActions } from '../hooks/useFileActions.js'
import { shorten } from '../functions/string.js'
import { t } from '../lang.js'

// Grid-view card for a single file: thumbnail, shortened filename, and an optional
// delete button (hidden in readOnly mode). Clicking the card fires 'selectfile'.
export function createFileCell(file, ctx) {
  const el = document.createElement('div')
  el.classList.add('fm-file')
  el.setAttribute('data-file-id', String(file.id))

  const thumb = document.createElement('div')
  thumb.classList.add('fm-thumbnail')
  const img = document.createElement('img')
  img.src = file.thumbnail
  img.alt = ''
  thumb.appendChild(img)

  const cleanups = []

  if (!ctx.options.readOnly) {
    const deleteBtn = document.createElement('button')
    deleteBtn.classList.add('fm-delete')
    deleteBtn.appendChild(iconDelete())
    cleanups.push(tooltip(deleteBtn, t('delete')))
    deleteBtn.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      actions.handleDelete()
    })
    thumb.appendChild(deleteBtn)
  }

  el.appendChild(thumb)

  const filename = document.createElement('div')
  filename.classList.add('fm-filename')
  filename.textContent = shorten(file.name, 30)
  el.appendChild(filename)

  const actions = useFileActions(file, el, ctx)
  el.addEventListener('click', actions.handleClick)

  return {
    element: el,
    destroy() {
      cleanups.forEach(c => c())
    },
  }
}
