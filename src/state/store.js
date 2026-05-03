/**
 * Minimal pub/sub store replacing svelte/store.
 * subscribe() calls fn immediately with the current value, exactly like Svelte stores.
 */
export function createStore(initial) {
  let value = initial
  const subscribers = new Set()
  return {
    get: () => value,
    set(v) {
      value = v
      subscribers.forEach(fn => fn(v))
    },
    update(fn) {
      this.set(fn(value))
    },
    subscribe(fn) {
      // Call fn immediately with the current value — mirrors the Svelte store contract
      // so components always receive an initial value upon subscribing.
      fn(value)
      subscribers.add(fn)
      // Returns an unsubscribe function; callers must invoke it to avoid memory leaks.
      return () => subscribers.delete(fn)
    },
  }
}
