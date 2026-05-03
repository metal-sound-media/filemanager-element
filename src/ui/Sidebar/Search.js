import { iconSearch } from '../icons/icons.js'

// Search input that writes to ctx.searchQuery. Resets automatically when the folder changes
// so stale search terms don't carry over to a different directory.
export function createSearch(container, ctx) {
  const form = document.createElement('form')
  form.classList.add('fm-search')

  const input = document.createElement('input')
  input.type = 'search'
  input.name = 'search'
  input.placeholder = 'e.g. image.png'

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.title = 'Search'
  btn.appendChild(iconSearch())

  form.appendChild(input)
  form.appendChild(btn)
  container.appendChild(form)

  const unsubs = []

  unsubs.push(ctx.searchQuery.subscribe(v => { if (input.value !== v) input.value = v }))
  unsubs.push(ctx.folder.subscribe(() => {
    input.value = ''
    ctx.searchQuery.set('')
  }))

  input.addEventListener('input', () => ctx.searchQuery.set(input.value))
  form.addEventListener('submit', e => e.preventDefault())

  return () => {
    unsubs.forEach(u => u())
    form.remove()
  }
}
