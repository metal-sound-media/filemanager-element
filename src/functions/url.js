// Converts a plain object to URLSearchParams, skipping undefined values so optional
// params are omitted from the URL rather than serialised as the string "undefined".
export function objToQueryParams(o, p) {
  const params = p || new URLSearchParams()
  Object.keys(o)
    .filter(k => o[k] !== undefined)
    .forEach(k => params.set(k, o[k]))
  return params
}
