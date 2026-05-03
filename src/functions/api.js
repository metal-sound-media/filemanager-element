import { objToQueryParams } from './url.js'

const HTTPStatus = { OK: 200, MultipleChoices: 300, NoContent: 204 }

export function fetchApi(baseUrl, path, options) {
  const o = { ...options }
  // Prefix relative baseUrls with the current origin so new URL() doesn't throw.
  let url = new URL((baseUrl.startsWith('/') ? window.location.origin : '') + baseUrl)
  url.pathname = (url.pathname === '/' ? '' : url.pathname) + path
  o.credentials = 'include'
  o.headers = { ...o.headers }
  o.headers['Accept'] = 'application/json'
  if (o.json) {
    o.body = JSON.stringify(o.json)
    o.headers['Content-Type'] = 'application/json'
  }
  if (o.query) objToQueryParams(o.query, url.searchParams)
  // Replace {paramName} placeholders in the path. new URL() percent-encodes the braces
  // to %7B/%7D, so we match the encoded form here.
  if (o.params) {
    Object.keys(o.params).forEach(k => {
      url.pathname = url.pathname.replace(`%7B${k}%7D`, o.params[k])
    })
  }
  return fetch(url.toString(), o).then(r => {
    // 204 No Content carries no body; any other 2xx is parsed as JSON.
    // Non-2xx responses are thrown so callers can catch them as errors.
    if (r.status === HTTPStatus.NoContent) return null
    if (r.status >= HTTPStatus.OK && r.status < HTTPStatus.MultipleChoices) return r.json()
    throw r
  })
}
