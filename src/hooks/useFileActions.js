import { removeFile, flash } from '../store/index.js'
import { t } from '../lang.js'

// Returns the three standard file interaction handlers:
//   handleClick  — dispatches a 'selectfile' custom event that bubbles to the host element
//   handleCopy   — copies the file URL to the clipboard and shows a success flash message
//   handleDelete — prompts for confirmation then dispatches the optimistic delete
export function useFileActions(file, element, ctx) {
  const handleDelete = () => {
    if (!confirm(t('deleteConfirm'))) return
    removeFile(ctx, file)
  }

  const handleClick = () => {
    element.dispatchEvent(new CustomEvent('selectfile', { detail: file, bubbles: true }))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(file.url)
    flash(ctx, t('copy'))
  }

  return { handleClick, handleCopy, handleDelete }
}
