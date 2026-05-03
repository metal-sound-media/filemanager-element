import { createStore } from './store.js'
import { QueryClient } from '../query/QueryClient.js'

// Creates the shared context object passed explicitly to all UI components and
// store functions. Holds all reactive stores, the query cache, and resolved options.
export function createContext(options) {
  // Current active folder (null = root).
  const folder = createStore(null)
  // Live search string typed by the user — filtering is applied client-side.
  const searchQuery = createStore('')
  // Array of flash message objects { id, type, message } shown in the alerts panel.
  const flashMessages = createStore([])

  // uploads wraps uploadsCore with a 300 ms debounce on push(): files that finish
  // uploading before the timer fires are never shown in the progress panel, preventing
  // flicker for fast uploads. timerMap tracks each file's pending timer by reference.
  const timerMap = new Map()
  const uploadsCore = createStore([])
  const uploads = {
    get: uploadsCore.get.bind(uploadsCore),
    set: uploadsCore.set.bind(uploadsCore),
    update: uploadsCore.update.bind(uploadsCore),
    subscribe: uploadsCore.subscribe.bind(uploadsCore),
    push(file) {
      const timer = setTimeout(() => uploadsCore.update(files => [file, ...files]), 300)
      timerMap.set(file, timer)
    },
    remove(file) {
      const timer = timerMap.get(file)
      // Cancel the pending timer so fast uploads never reach the progress UI.
      if (timer !== undefined) { clearTimeout(timer); timerMap.delete(file) }
      uploadsCore.update(files => files.filter(f => f !== file))
    },
  }

  // Ordered array of ancestor folders from root to the current folder, used by
  // the breadcrumb component. Always starts with null (the root sentinel).
  const folderPath = createStore([null])

  return { options, queryClient: new QueryClient(), folder, folderPath, searchQuery, flashMessages, uploads }
}
