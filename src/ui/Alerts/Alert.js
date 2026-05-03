import { iconCircleCheck, iconCircleExclamation } from '../icons/icons.js'
import { deleteFlashMessage } from '../../store/index.js'

// Renders a single flash message. Success alerts include a CSS progress bar that
// animates over the 2 s auto-dismiss window. Danger alerts show until manually closed.
export function createAlert(message, ctx) {
  const el = document.createElement('div')
  el.classList.add('fm-alert')
  if (message.type === 'danger') {
    el.classList.add('fm-danger')
    el.appendChild(iconCircleExclamation())
  } else {
    el.classList.add('fm-success')
    el.appendChild(iconCircleCheck())
    const progress = document.createElement('div')
    progress.classList.add('fm-progress')
    el.appendChild(progress)
  }
  const text = document.createTextNode(message.message)
  el.appendChild(text)

  const closeBtn = document.createElement('button')
  closeBtn.classList.add('fm-close')
  closeBtn.innerHTML = '&times;'
  closeBtn.addEventListener('click', e => {
    e.preventDefault()
    deleteFlashMessage(ctx, message.id)
  })
  el.appendChild(closeBtn)

  return { element: el, destroy: () => {} }
}
