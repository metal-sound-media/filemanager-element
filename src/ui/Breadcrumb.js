import { iconHome, iconArrowRight, iconButton } from './icons/icons.js'
import { foldersQueryKey } from '../store/index.js'
import { autofocus } from '../actions/autofocus.js'
import { t } from '../lang.js'

export function createBreadcrumb(container, ctx) {
  const nav = document.createElement('nav')
  nav.classList.add('fm-breadcrumb')
  container.appendChild(nav)

  let editing = false
  const unsubs = []

  // Converts [null, {name:'images'}, {name:'2024'}] → "images/2024" (root null is omitted).
  function pathToString(path) {
    return path.filter(f => f !== null).map(f => f.name).join('/')
  }

  function render(path) {
    if (editing) return
    nav.innerHTML = ''

    const scrollContainer = document.createElement('div')
    scrollContainer.classList.add('fm-breadcrumb-scroll')

    path.forEach((folder, i) => {
      const isLast = i === path.length - 1

      const btn = document.createElement('button')
      btn.classList.add('fm-breadcrumb-item')

      if (folder === null) {
        btn.appendChild(iconHome(14))
        btn.setAttribute('aria-label', t('root'))
        if (isLast) btn.classList.add('fm-breadcrumb-current')
        else btn.addEventListener('click', e => {
          e.stopPropagation()
          ctx.folder.set(folder)
          ctx.folderPath.set(path.slice(0, i + 1))
        })
        nav.appendChild(btn)
      } else {
        const sep = document.createElement('span')
        sep.classList.add('fm-breadcrumb-sep')
        sep.textContent = '/'
        scrollContainer.appendChild(sep)

        btn.textContent = folder.name
        if (isLast) {
          btn.classList.add('fm-breadcrumb-current')
        } else {
          btn.addEventListener('click', e => {
            e.stopPropagation()
            ctx.folder.set(folder)
            ctx.folderPath.set(path.slice(0, i + 1))
          })
        }
        scrollContainer.appendChild(btn)
      }
    })

    nav.appendChild(scrollContainer)
    scrollContainer.scrollLeft = scrollContainer.scrollWidth
  }

  nav.addEventListener('click', e => {
    if (editing) return
    // Clicking a non-last item navigates (handled inline above, with stopPropagation)
    // Clicking the last item or the nav background → enter edit mode
    enterEditMode()
  })

  function enterEditMode() {
    if (editing) return
    editing = true
    nav.innerHTML = ''

    const path = ctx.folderPath.get()
    const pathStr = pathToString(path)

    const wrapper = document.createElement('div')
    wrapper.classList.add('fm-breadcrumb-form')

    const slash = document.createElement('span')
    slash.classList.add('fm-breadcrumb-sep')
    slash.style.flexShrink = '0'
    slash.textContent = '/'
    wrapper.appendChild(slash)

    const input = document.createElement('input')
    input.type = 'text'
    input.value = pathStr
    input.classList.add('fm-breadcrumb-input')
    wrapper.appendChild(input)

    const submitBtn = iconButton(iconArrowRight(12))
    wrapper.appendChild(submitBtn)
    nav.appendChild(wrapper)

    autofocus(input)

    async function doNavigate() {
      const typed = input.value.trim()
      editing = false
      await navigateToPath(typed)
      render(ctx.folderPath.get())
    }

    function cancel() {
      editing = false
      render(ctx.folderPath.get())
    }

    input.addEventListener('keydown', async e => {
      if (e.key === 'Escape') { cancel(); return }
      if (e.key === 'Enter') { e.preventDefault(); await doNavigate() }
    })

    submitBtn.addEventListener('click', async e => { e.stopPropagation(); await doNavigate() })
  }

  // Walk each path segment, resolving folder IDs one level at a time.
  // Serves from cache when available; falls back to a network fetch and seeds the cache.
  // Case-insensitive name matching. Aborts silently if any segment is not found.
  async function navigateToPath(pathStr) {
    const segments = pathStr.split('/').map(s => s.trim()).filter(Boolean)
    if (segments.length === 0) {
      ctx.folder.set(null)
      ctx.folderPath.set([null])
      return
    }

    let parentId = null
    let resolvedFolder = null
    const resolvedPath = [null]

    for (const segment of segments) {
      const queryKey = foldersQueryKey(parentId)
      let folders = ctx.queryClient.getQueryData(queryKey)

      if (!folders) {
        try {
          folders = await ctx.options.getFolders(resolvedFolder ?? undefined)
          ctx.queryClient.setQueryData(queryKey, folders)
        } catch {
          return
        }
      }

      const match = folders.find(f => f.name.toLowerCase() === segment.toLowerCase())
      if (!match) return

      resolvedFolder = match
      resolvedPath.push(match)
      parentId = match.id
    }

    ctx.folder.set(resolvedFolder)
    ctx.folderPath.set(resolvedPath)
  }

  unsubs.push(ctx.folderPath.subscribe(path => {
    if (!editing) render(path)
  }))

  return () => {
    unsubs.forEach(u => u())
    nav.remove()
  }
}
