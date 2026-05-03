// Attaches the same callback to multiple event names and returns a single cleanup function.
export function $on(el, eventNames, cb) {
  eventNames.forEach(name => el.addEventListener(name, cb))
  return () => eventNames.forEach(name => el.removeEventListener(name, cb))
}
