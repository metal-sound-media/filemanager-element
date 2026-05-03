import { iconUpload } from './icons/icons.js'
import { dragOver } from '../actions/dragOver.js'
import { uploadFile } from '../store/index.js'

// Creates the main content area and wires up drag-and-drop file uploading.
// The dragOver action converts raw drag events into 'dropzoneover'/'dropzoneleave'
// so this component only handles semantic events. On drop, each file is pushed
// into the uploads store (which drives the progress panel), uploaded, then removed.
export function createDropzone(container, ctx) {
  const main = document.createElement('main')
  main.classList.add('fm-main')
  container.appendChild(main)

  const cleanups = []

  if (!ctx.options.readOnly) {
    let over = false
    const dropzoneEl = document.createElement('span')
    dropzoneEl.classList.add('fm-dropzone')

    const uploadIcon = iconUpload(false)
    dropzoneEl.appendChild(uploadIcon)

    const cleanupDragOver = dragOver(main)
    cleanups.push(cleanupDragOver)

    main.addEventListener('dropzoneover', () => {
      over = true
      dropzoneEl.classList.add('active')
      dropzoneEl.innerHTML = ''
      dropzoneEl.appendChild(iconUpload(true))
    })
    main.addEventListener('dropzoneleave', () => {
      over = false
      dropzoneEl.classList.remove('active')
      dropzoneEl.innerHTML = ''
      dropzoneEl.appendChild(iconUpload(false))
    })
    main.addEventListener('drop', e => {
      Array.from(e.dataTransfer.files).forEach(async file => {
        ctx.uploads.push(file)
        await uploadFile(ctx, file, ctx.folder.get())
        ctx.uploads.remove(file)
      })
    })

    main.appendChild(dropzoneEl)
  }

  return main
}
