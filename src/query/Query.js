import { createStore } from '../state/store.js'
import { isPromise } from '../functions/promise.js'

// Single-fetch cache entry: data is fetched once on construction and served from
// the in-memory store on subsequent reads. Re-fetch is available via state.refetch.
export class Query {
  constructor(cb, options) {
    const fetchData = () => {
      // Cache hit — skip the fetch if data is already present.
      if (this.getData()) return
      const response = cb()
      // Supports both async (Promise) and synchronous fetchers.
      if (isPromise(response)) {
        response.then(this.setData).catch(() => {
          options.onError?.()
          this.store.update(v => ({ ...v, isLoading: false, isSuccess: false }))
        })
      } else {
        this.setData(response)
      }
    }

    this.store = createStore({
      isSuccess: false,
      isLoading: false,
      data: undefined,
      refetch: fetchData,
    })

    // enabled: false defers the initial fetch; the caller triggers refetch() when
    // the data is actually needed (e.g. lazy-loaded folder children).
    if (options.enabled !== false) {
      fetchData()
    }
  }

  getState = () => this.store.get()

  // Accepts a raw value or an updater function (receives current data, returns new data),
  // mirroring the React Query / immer-style setQueryData API.
  setData = (newData) => {
    this.store.update(v => ({
      ...v,
      isLoading: false,
      isSuccess: true,
      data: typeof newData === 'function' ? newData(v.data) : newData,
    }))
  }

  getData = () => this.getState().data
}
