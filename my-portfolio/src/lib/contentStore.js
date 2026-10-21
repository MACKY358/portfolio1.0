import defaultContent from '../content/content.json'

const STORAGE_KEY = 'portfolio-content-v1'
const DRAFT_KEY = 'portfolio-draft-v1'
const AUTH_KEY = 'portfolio-auth-v1'
const PASSWORD_KEY = 'portfolio-password-v1'
const REMOTE_BASE_KEY = 'portfolio-remote-base-v1'

export const DEFAULT_PASSWORD = 'admin'

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Deep merge where arrays are replaced wholesale (not merged index by index).
 * This keeps list edits predictable when the saved content has fewer items
 * than the defaults.
 */
function merge(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : override
  }

  const result = { ...base }
  for (const key of Object.keys(override)) {
    const baseValue = base[key]
    const overrideValue = override[key]
    result[key] =
      isPlainObject(baseValue) && isPlainObject(overrideValue)
        ? merge(baseValue, overrideValue)
        : overrideValue
  }
  return result
}

function readJson(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** The content currently published by the site (what visitors see). */
export function loadPublished() {
  const stored = readJson(STORAGE_KEY)
  return stored ? merge(defaultContent, stored) : defaultContent
}

/** Unsaved edits held in the admin panel. */
export function loadDraft() {
  return readJson(DRAFT_KEY)
}

export function saveDraft(content) {
  return writeJson(DRAFT_KEY, content)
}

export function clearDraft() {
  window.localStorage.removeItem(DRAFT_KEY)
}

/** Commit the draft to the published content that visitors see. */
export function publish(content) {
  return writeJson(STORAGE_KEY, content)
}

export function resetPublished() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(DRAFT_KEY)
  window.localStorage.removeItem(REMOTE_BASE_KEY)
  return defaultContent
}

/** True when published content differs from the bundled content.json. */
export function isPublishedModified() {
  return window.localStorage.getItem(STORAGE_KEY) !== null
}

export function hasDraft() {
  return window.localStorage.getItem(DRAFT_KEY) !== null
}

// --- Last synced repository content ---------------------------------------
// The admin panel keeps a copy of the content.json it last read from or
// wrote to the repository. Before pushing it compares the repository against
// this copy, so a push can never silently overwrite changes that were made
// somewhere else.

export function saveRemoteBase(content) {
  try {
    window.localStorage.setItem(REMOTE_BASE_KEY, JSON.stringify(content))
    return true
  } catch {
    return false
  }
}

export function loadRemoteBase() {
  return readJson(REMOTE_BASE_KEY)
}

export function clearRemoteBase() {
  window.localStorage.removeItem(REMOTE_BASE_KEY)
}

// --- Admin password -------------------------------------------------------
// This gates the admin UI only. It is not real server-side security; anyone
// with devtools can read localStorage. Treat it as a convenience lock.
//
// The sign-in is kept in sessionStorage by default, so the admin panel asks
// for the password again on each new browser session. Choosing "keep me
// signed in" also stores the flag in localStorage.

export function isAuthenticated() {
  return (
    window.sessionStorage.getItem(AUTH_KEY) === 'true' ||
    window.localStorage.getItem(AUTH_KEY) === 'true'
  )
}

export function authenticate(password, remember = false) {
  const stored = window.localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD
  if (password !== stored) return false
  window.sessionStorage.setItem(AUTH_KEY, 'true')
  if (remember) window.localStorage.setItem(AUTH_KEY, 'true')
  return true
}

export function logout() {
  window.sessionStorage.removeItem(AUTH_KEY)
  window.localStorage.removeItem(AUTH_KEY)
}

export function changePassword(current, next) {
  const stored = window.localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD
  if (current !== stored) return false
  window.localStorage.setItem(PASSWORD_KEY, next)
  return true
}

export function getPasswordHint() {
  return window.localStorage.getItem(PASSWORD_KEY) ? 'Custom password set' : `Default password: ${DEFAULT_PASSWORD}`
}

// --- Import / export ------------------------------------------------------

export function exportContent(content) {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'content.json'
  link.click()
  URL.revokeObjectURL(url)
}

export function importContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        resolve(merge(defaultContent, parsed))
      } catch {
        reject(new Error('That file is not valid JSON'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsText(file)
  })
}
