import { createStore } from '../state/store.js'

// Manages the state for a side-effect operation (create/update/delete).
// mutate()      — fire-and-forget; errors are silently swallowed
// mutateAsync() — returns the promise so callers can await and handle errors themselves
export function useMutation(cb, options = {}) {
  const mutate = (arg) => {
    store.update(v => ({ ...v, isLoading: true }))
    return cb(arg)
      .then(data => {
        options.onSuccess?.(data)
        return data
      })
      .catch(reason => {
        options.onError?.(reason)
        throw reason
      })
      .finally(() => {
        store.update(v => ({ ...v, isLoading: false }))
      })
  }

  const store = createStore({
    isLoading: false,
    mutate: (arg) => { mutate(arg).catch(() => null) },
    mutateAsync: mutate,
  })

  return store
}
