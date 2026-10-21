const MAX_DIMENSION = 1600
const QUALITY = 0.85
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']

export function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/')
}

export function isImageFile(file) {
  return ACCEPTED_TYPES.includes(file.type)
}

/**
 * Reads an image file and returns a compressed data URL.
 *
 * Large photos are downscaled to MAX_DIMENSION and re-encoded as JPEG so the
 * result fits comfortably in localStorage and stays small when exported.
 * SVG is passed through untouched because rasterising it would lose vectors.
 */
export async function compressImageFile(file) {
  if (!isImageFile(file)) {
    throw new Error('That file is not a supported image')
  }

  if (file.type === 'image/svg+xml') {
    const dataUrl = await readFileAsDataUrl(file)
    return { dataUrl, width: null, height: null, bytes: file.size }
  }

  const source = await readFileAsDataUrl(file)
  const bitmap = await loadImage(source)

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  context.drawImage(bitmap, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
  bitmap.close?.()

  return {
    dataUrl,
    width,
    height,
    bytes: Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75),
  }
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not decode the image'))
    image.src = src
  })
}

/** Strips the `data:image/...;base64,` prefix, leaving raw base64. */
export function dataUrlToBase64(dataUrl) {
  const index = dataUrl.indexOf(',')
  return index === -1 ? dataUrl : dataUrl.slice(index + 1)
}

/** Rough byte size of a data URL once decoded. */
export function dataUrlBytes(dataUrl) {
  if (!isDataUrl(dataUrl)) return 0
  return Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Deterministic short hash of a string. Used to name uploaded files so that
 * re-publishing the same image does not create duplicate files in the repo.
 */
export function shortHash(input) {
  let hash = 5381
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return (hash >>> 0).toString(36).slice(0, 8)
}

/** Builds a stable, descriptive file name for an uploaded image. */
export function buildImageName(baseName, dataUrl) {
  const clean = baseName
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image'

  const isSvg = dataUrl.startsWith('data:image/svg+xml')
  const extension = isSvg ? 'svg' : 'jpg'
  return `${clean}-${shortHash(dataUrl)}.${extension}`
}

/**
 * Converts a repository path into the URL the site serves it from.
 *
 * The `public/` folder is published at the site root, so
 * `my-portfolio/public/images/me.png` is served as `/images/me.png`.
 */
export function repoPathToPublicPath(repoPath, publicDir = 'public') {
  if (!repoPath) return ''
  const marker = `/${publicDir}/`
  const index = repoPath.indexOf(marker)
  if (index !== -1) {
    // Skip past "/public/" so only the part after it is kept.
    return repoPath.slice(index + marker.length - 1)
  }
  return repoPath.startsWith('/') ? repoPath : `/${repoPath}`
}

/**
 * Walks a content tree and returns every field holding a data URL, with the
 * path needed to replace it later.
 */
export function findDataUrlFields(content, path = []) {
  const found = []

  const walk = (value, currentPath) => {
    if (typeof value === 'string') {
      if (isDataUrl(value)) found.push({ path: currentPath, value })
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...currentPath, index]))
      return
    }
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, child]) => walk(child, [...currentPath, key]))
    }
  }

  walk(content, path)
  return found
}

/** Returns a new content tree with the value at `path` replaced. */
export function setAtPath(content, path, value) {
  if (path.length === 0) return value

  const [head, ...rest] = path
  if (Array.isArray(content)) {
    const copy = [...content]
    copy[head] = setAtPath(copy[head], rest, value)
    return copy
  }

  return {
    ...content,
    [head]: setAtPath(content?.[head], rest, value),
  }
}
