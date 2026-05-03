import { iconFolder, iconLoader, iconArrowRight, iconButton } from '../icons/icons.js'
import { clickOutside } from '../../actions/clickOutside.js'
import { autofocus } from '../../actions/autofocus.js'
import { useCreateFolderMutation } from '../../store/index.js'
import { t } from '../../lang.js'

// Inline folder-creation form rendered inside the sidebar tree.
// autofocus() focuses the input immediately on mount.
// clickOutside() cancels the form when the user clicks elsewhere.
// Fields are disabled while the mutation is in-flight to prevent double submission.
export function createNewFolder(container, parent, onSubmit, onCancel, ctx) {
  const form = document.createElement('form')
  form.classList.add('fm-folder-form')
  form.action = ''

  form.appendChild(iconFolder())

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = t('newFolderPlaceholder')
  input.name = 'name'
  input.required = true
  form.appendChild(input)

  const createFolderMutation = useCreateFolderMutation(ctx)
  const submitIcon = iconButton(iconArrowRight(12))

  form.appendChild(submitIcon)
  container.appendChild(form)

  autofocus(input)

  const unsubs = []
  unsubs.push(createFolderMutation.subscribe(state => {
    input.disabled = state.isLoading
    submitIcon.disabled = state.isLoading
    submitIcon.innerHTML = ''
    submitIcon.appendChild(state.isLoading ? iconLoader(12) : iconArrowRight(12))
  }))

  form.addEventListener('submit', async e => {
    e.preventDefault()
    const name = new FormData(form).get('name').toString()
    await createFolderMutation.get().mutateAsync({ name, parent: parent?.id })
    onSubmit()
  })

  const cleanupOutclick = clickOutside(form)
  form.addEventListener('outclick', onCancel)

  return () => {
    unsubs.forEach(u => u())
    cleanupOutclick()
    form.remove()
  }
}
