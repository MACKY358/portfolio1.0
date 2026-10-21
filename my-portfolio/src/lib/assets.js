const BASE = import.meta.env.BASE_URL || '/'

/**
 * Resolves a content image path against the Vite base.
 *
 * With a relative base the site can be served from a subpath such as
 * https://<user>.github.io/<repo>/, where a root-relative "/images/x.png"
 * would 404. Absolute URLs and data URLs are returned untouched.
 */
export function assetUrl(path) {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  const clean = path.startsWith('/') ? path.slice(1) : path
  return `${BASE}${clean}`
}
