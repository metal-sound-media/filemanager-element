export function isPromise(value) {
  return value !== null && typeof value === 'object' && typeof value.then === 'function'
}
