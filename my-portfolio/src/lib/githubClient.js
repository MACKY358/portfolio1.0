const API_BASE = 'https://api.github.com'

/**
 * Minimal GitHub REST client for committing files from the browser.
 *
 * Uses the Contents API with a fine-grained personal access token that has
 * "Contents: read and write" permission on the target repository. The token
 * is only ever sent to api.github.com and is kept in localStorage.
 */

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers || {}) },
  })

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message =
      payload?.message || `GitHub returned ${response.status} ${response.statusText}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

export async function verifyToken(owner, repo, token) {
  const user = await request('/user', token)
  const repoInfo = await request(`/repos/${owner}/${repo}`, token)
  return {
    login: user.login,
    repo: repoInfo.full_name,
    defaultBranch: repoInfo.default_branch,
    private: repoInfo.private,
  }
}

/** Returns the file's sha if it exists, otherwise null. */
export async function getFileSha(owner, repo, path, branch, token) {
  try {
    const file = await request(
      `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
      token,
    )
    return file.sha
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}

/**
 * Writes a base64-encoded file to the repository and creates a commit.
 */
export async function putFile(owner, repo, path, branch, token, base64Content, message) {
  const sha = await getFileSha(owner, repo, path, branch, token)

  return request(`/repos/${owner}/${repo}/contents/${encodePath(path)}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: base64Content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  })
}

/** Lists every image file in a repository folder. */
export async function listImages(owner, repo, folder, branch, token) {
  try {
    const entries = await request(
      `/repos/${owner}/${repo}/contents/${encodePath(folder)}?ref=${encodeURIComponent(branch)}`,
      token,
    )
    if (!Array.isArray(entries)) return []
    return entries
      .filter((entry) => entry.type === 'file' && /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(entry.name))
      .map((entry) => ({
        name: entry.name,
        path: entry.path,
        size: entry.size,
        url: entry.download_url,
      }))
  } catch (error) {
    if (error.status === 404) return []
    throw error
  }
}

/** Reads a text file from the repository, returns null when missing. */
export async function getFileContent(owner, repo, path, branch, token) {
  const sha = await getFileSha(owner, repo, path, branch, token)
  if (!sha) return null

  const file = await request(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
    token,
  )

  if (file.encoding === 'base64') {
    const binary = atob(file.content.replace(/\n/g, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  }

  return file.content
}

function encodePath(path) {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

/** UTF-8 string to base64, safe for non-ASCII characters. */
export function encodeTextBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}
