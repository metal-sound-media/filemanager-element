import { renderList } from '../../state/list.js'

// Shows in-progress uploads in an aside panel. Hidden when the uploads list is empty.
// Items are keyed by name+size; the panel appears only after the 300 ms debounce in context.js.
function createUploadItem(file) {
  const el = document.createElement('div')
  el.classList.add('fm-upload-progress-item')
  el.textContent = file.name
  const bar = document.createElement('div')
  bar.classList.add('fm-upload-progress-bar')
  el.appendChild(bar)
  return { element: el, destroy: () => {} }
}

export function createUploadProgress(container, ctx) {
  const aside = document.createElement('aside')
  aside.classList.add('fm-upload-progress')
  aside.hidden = true
  container.appendChild(aside)

  const itemMap = new Map()

  const unsub = ctx.uploads.subscribe(files => {
    aside.hidden = files.length === 0
    renderList(aside, files, f => f.name + f.size, createUploadItem, itemMap)
  })

  return () => {
    unsub()
    for (const entry of itemMap.values()) entry.destroy()
    aside.remove()
  }
}
