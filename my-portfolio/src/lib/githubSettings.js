const GITHUB_KEY = 'portfolio-github-v1'

const DEFAULTS = {
  owner: 'snoopy0979',
  repo: 'portfolio',
  branch: 'main',
  contentPath: 'my-portfolio/src/content/content.json',
  imagesPath: 'my-portfolio/public/images',
  token: '',
}

export function loadGithubSettings() {
  try {
    const raw = window.localStorage.getItem(GITHUB_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveGithubSettings(settings) {
  try {
    window.localStorage.setItem(GITHUB_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export function hasToken(settings = loadGithubSettings()) {
  return Boolean(settings.token && settings.owner && settings.repo)
}

export function clearGithubSettings() {
  window.localStorage.removeItem(GITHUB_KEY)
}
