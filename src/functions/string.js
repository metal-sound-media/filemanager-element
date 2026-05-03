// Truncates long filenames while keeping the extension visible.
// Keeps the first (max-11) chars, a "..." separator, and the last 8 chars.
// e.g. shorten("verylongfilename.png", 20) → "verylon...name.png"
export function shorten(str, max) {
  if (str.length <= max) return str
  return str.slice(0, max - 11) + '...' + str.slice(-8)
}
