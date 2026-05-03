import FR from './langs/fr.js'
import EN from './langs/en.js'

const langs = { fr: FR, en: EN }
let langMessages = EN

export function t(key) {
  return langMessages[key]
}

// Falls back to English if the requested locale is not supported.
export function setLang(lang) {
  langMessages = lang in langs ? langs[lang] : EN
}
