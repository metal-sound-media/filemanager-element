import { Query } from './Query.js'

// Central registry for all Query instances. Each unique string key maps to one Query,
// so multiple components subscribed to the same key share a single fetch and cache entry.
export class QueryClient {
  constructor() {
    this.queries = new Map()
  }

  // Get-or-create: the first call for a given key constructs the Query and triggers
  // the initial fetch; subsequent calls return the same instance from the Map.
  getQuery(key, cb, options = {}) {
    if (!this.queries.has(key)) {
      this.queries.set(key, new Query(cb, options))
    }
    return this.queries.get(key)
  }

  // Route through Query.setData so all store subscribers are notified via the pub/sub.
  setQueryData(key, updater) {
    const query = this.queries.get(key)
    if (query) query.setData(updater)
  }

  getQueryData(key) {
    return this.queries.get(key)?.getData()
  }

  getQueryState(key) {
    const query = this.queries.get(key)
    if (query) return query.getState()
    return { data: undefined, isLoading: false, isSuccess: false, refetch: () => {} }
  }
}
