import { useEffect, useRef, useState } from 'react'
import '../admin.css'
import { useContent } from '../context/useContent'
import ImageField from './ImageField'
import {
  changePassword,
  exportContent,
  importContent,
  isAuthenticated,
  loadRemoteBase,
  logout,
  saveRemoteBase,
} from '../lib/contentStore'
import {
  buildImageName,
  dataUrlToBase64,
  findDataUrlFields,
  repoPathToPublicPath,
  setAtPath,
} from '../lib/imageStore'
import {
  encodeTextBase64,
  getFileContent,
  listImages,
  putFile,
  verifyToken,
} from '../lib/githubClient'
import {
  clearGithubSettings,
  hasToken,
  loadGithubSettings,
  saveGithubSettings,
} from '../lib/githubSettings'
import { assetUrl } from '../lib/assets'
import Navbar from './Navbar'
import Home from './Home'
import Experiences from './Experiences'
import Skills from './Skills'
import About from './About'
import Contact from './Contact'

const TABS = [
  { id: 'site', label: 'Site' },
  { id: 'home', label: 'Hero' },
  { id: 'stats', label: 'Stats' },
  { id: 'skills', label: 'Skills' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'settings', label: 'Settings' },
]

// --- small building blocks ------------------------------------------------

function Field({ label, children, hint }) {
  return (
    <label className="adm-field">
      <span className="adm-label">{label}</span>
      {children}
      {hint ? <span className="adm-hint">{hint}</span> : null}
    </label>
  )
}

function Text({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      className="adm-input"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function TextArea({ value, onChange, rows = 4 }) {
  return (
    <textarea
      className="adm-input adm-textarea"
      rows={rows}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="adm-toggle">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <strong>{label}</strong>
        {hint ? <span className="adm-hint">{hint}</span> : null}
      </span>
    </label>
  )
}

function ListEditor({ items, onChange, makeItem, primaryKey, secondaryKey, primaryLabel, secondaryLabel }) {
  const updateItem = (index, key, value) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    onChange(next)
  }

  const move = (index, delta) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange(next)
  }

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const add = () => {
    onChange([...items, makeItem()])
  }

  return (
    <div className="adm-list">
      {items.map((item, index) => (
        <div className="adm-list-row" key={index}>
          <div className="adm-list-fields">
            <Text
              value={item[primaryKey]}
              placeholder={primaryLabel}
              onChange={(value) => updateItem(index, primaryKey, value)}
            />
            <Text
              value={item[secondaryKey]}
              placeholder={secondaryLabel}
              onChange={(value) => updateItem(index, secondaryKey, value)}
            />
          </div>
          <div className="adm-list-actions">
            <button type="button" onClick={() => move(index, -1)} title="Move up">
              ↑
            </button>
            <button type="button" onClick={() => move(index, 1)} title="Move down">
              ↓
            </button>
            <button type="button" className="adm-danger" onClick={() => remove(index)} title="Remove">
              ✕
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="adm-add" onClick={add}>
        + Add item
      </button>
    </div>
  )
}

// --- live preview ---------------------------------------------------------

const PREVIEW_WIDTH = 1280

function LivePreview({ content }) {
  const frameRef = useRef(null)
  const [scale, setScale] = useState(0.42)

  // Scale the desktop layout down to fit the available frame width. `zoom`
  // is used rather than `transform: scale` so the frame can scroll naturally:
  // transform leaves the layout box at full size and breaks scroll extents.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined

    const measure = () => {
      const available = frame.clientWidth - 24
      if (available <= 0) return
      setScale(Math.min(Math.max(available / PREVIEW_WIDTH, 0.2), 1))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="adm-preview">
      <div className="adm-preview-label">Live preview</div>
      <div className="adm-preview-frame" ref={frameRef}>
        <div
          className="adm-preview-scale"
          style={{
            width: PREVIEW_WIDTH,
            zoom: scale,
            backgroundImage: content.site.backgroundImage
              ? `url("${assetUrl(content.site.backgroundImage)}")`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Navbar />
          <Home />
          <Experiences />
          <Skills />
          <About />
          <Contact />
        </div>
      </div>
    </div>
  )
}

// --- main admin ------------------------------------------------------------

function AdminPanel({ onSignOut }) {
  const { content, replaceContent, update, updateList, dirty, publish, discardDraft, resetAll, reloadDraft } =
    useContent()
  const [tab, setTab] = useState('site')
  const [showPreview, setShowPreview] = useState(true)
  const [message, setMessage] = useState('')
  const fileInput = useRef(null)

  const [github, setGithub] = useState(() => loadGithubSettings())
  const [repoImages, setRepoImages] = useState([])
  const [githubStatus, setGithubStatus] = useState('')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    reloadDraft()
  }, [reloadDraft])

  useEffect(() => {
    document.body.classList.add('admin-active')
    document.title = 'Admin | Portfolio'
    return () => {
      document.body.classList.remove('admin-active')
    }
  }, [])

  const flash = (text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2500)
  }

  const handlePublish = () => {
    publish()
    flash('Published. Your site now shows these changes.')
  }

  const handleDiscard = () => {
    discardDraft()
    flash('Draft discarded.')
  }

  const handleReset = () => {
    if (window.confirm('Reset everything back to the original content.json? This cannot be undone.')) {
      resetAll()
      flash('Reset to defaults.')
    }
  }

  const handleExport = () => {
    exportContent(content)
    flash('Downloaded content.json')
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const imported = await importContent(file)
      replaceContent(imported)
      flash('Imported. Review and publish when ready.')
    } catch (error) {
      flash(error.message)
    } finally {
      event.target.value = ''
    }
  }

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const handleChangePassword = () => {
    if (changePassword(currentPassword, newPassword)) {
      setPasswordMessage('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
    } else {
      setPasswordMessage('Current password is incorrect.')
    }
  }

  // --- GitHub ---------------------------------------------------------------

  const updateGithub = (key, value) => {
    setGithub((current) => ({ ...current, [key]: value }))
  }

  const handleSaveGithub = () => {
    saveGithubSettings(github)
    flash('GitHub settings saved.')
  }

  const handleConnectGithub = async () => {
    setGithubStatus('Connecting...')
    try {
      const info = await verifyToken(github.owner, github.repo, github.token)
      setGithubStatus(`Connected as ${info.login} · ${info.repo} (${info.defaultBranch})`)
      if (!github.branch) updateGithub('branch', info.defaultBranch)
    } catch (error) {
      setGithubStatus(`Could not connect: ${error.message}`)
    }
  }

  const loadRepoImages = async () => {
    if (!hasToken(github)) {
      setGithubStatus('Add a token first.')
      return
    }
    setGithubStatus('Loading images...')
    try {
      const images = await listImages(
        github.owner,
        github.repo,
        github.imagesPath,
        github.branch,
        github.token,
      )
      // Repository paths are not URLs. The public folder is served from the
      // site root, so my-portfolio/public/images/me.png becomes /images/me.png.
      const withPublicPaths = images.map((image) => ({
        ...image,
        publicPath: repoPathToPublicPath(image.path),
      }))
      setRepoImages(withPublicPaths)
      setGithubStatus(`Loaded ${images.length} image${images.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setGithubStatus(`Could not load images: ${error.message}`)
    }
  }

  /**
   * Commits every uploaded image plus the updated content.json to GitHub.
   * Uploaded images are written as real files under public/images and the
   * content is rewritten to point at those paths, so the published site
   * serves normal image files instead of inline base64.
   */
  const handleSyncGithub = async () => {
    if (!hasToken(github)) {
      flash('Connect to GitHub first.')
      return
    }

    setSyncing(true)
    setGithubStatus('Checking the repository for newer changes...')

    let uploadedCount = 0

    try {
      // Guard against overwriting changes that were made in the repository
      // since this editor last synced. Without this check a stale browser tab
      // can silently roll the repository back.
      const remoteRaw = await getFileContent(
        github.owner,
        github.repo,
        github.contentPath,
        github.branch,
        github.token,
      )

      if (remoteRaw) {
        let remoteContent
        try {
          remoteContent = JSON.parse(remoteRaw)
        } catch {
          remoteContent = null
        }

        const base = loadRemoteBase()

        if (remoteContent && base && JSON.stringify(remoteContent) !== JSON.stringify(base)) {
          setGithubStatus(
            'The repository has changes that are not in this editor. Pull from GitHub first, then push again.',
          )
          flash('Repository has newer changes. Pull first.')
          return
        }

        if (remoteContent && !base) {
          setGithubStatus(
            'This editor has not synced with the repository yet. Pull from GitHub first to be safe.',
          )
          flash('Pull from GitHub first.')
          return
        }
      }

      setGithubStatus('Uploading images...')

      const embedded = findDataUrlFields(content)
      let nextContent = content

      for (const field of embedded) {
        const fileName = buildImageName(field.path.join('-'), field.value)
        const repoPath = `${github.imagesPath}/${fileName}`

        await putFile(
          github.owner,
          github.repo,
          repoPath,
          github.branch,
          github.token,
          dataUrlToBase64(field.value),
          `Add ${fileName}`,
        )
        uploadedCount += 1

        nextContent = setAtPath(nextContent, field.path, repoPathToPublicPath(repoPath))
      }

      setGithubStatus('Committing content.json...')

      await putFile(
        github.owner,
        github.repo,
        github.contentPath,
        github.branch,
        github.token,
        encodeTextBase64(`${JSON.stringify(nextContent, null, 2)}\n`),
        `Update portfolio content${embedded.length ? ` (${embedded.length} image${embedded.length === 1 ? '' : 's'})` : ''}`,
      )

      // Swap the local copy over to the committed paths so the editor and the
      // live site agree from now on.
      replaceContent(nextContent)

      // Remember what the repository now holds, so the next push can tell
      // whether the repository moved ahead in the meantime.
      saveRemoteBase(nextContent)

      setGithubStatus(`Synced to ${github.owner}/${github.repo}.`)
      flash('Pushed to GitHub.')
    } catch (error) {
      const partial = uploadedCount
        ? ` ${uploadedCount} image${uploadedCount === 1 ? '' : 's'} were uploaded before the error.`
        : ''
      setGithubStatus(`Sync failed: ${error.message}.${partial}`)
    } finally {
      setSyncing(false)
    }
  }

  /** Pulls content.json from GitHub into the editor. */
  const handlePullGithub = async () => {
    if (!hasToken(github)) {
      flash('Connect to GitHub first.')
      return
    }
    setGithubStatus('Pulling content.json...')
    try {
      const raw = await getFileContent(
        github.owner,
        github.repo,
        github.contentPath,
        github.branch,
        github.token,
      )
      if (!raw) {
        setGithubStatus('No content.json found in the repository.')
        return
      }
      const parsed = JSON.parse(raw)
      replaceContent(parsed)
      saveRemoteBase(parsed)
      setGithubStatus('Pulled content.json from GitHub.')
    } catch (error) {
      setGithubStatus(`Pull failed: ${error.message}`)
    }
  }

  const site = content.site
  const home = content.home
  const skills = content.skills
  const about = content.about
  const contact = content.contact

  const navLinks = site.navLinks

  const panels = (
    <>
        {tab === 'site' && (
          <>
            <h2 className="adm-title">Site</h2>

            <Field label="Logo text">
              <Text value={site.logo} onChange={(value) => update(['site', 'logo'], value)} />
            </Field>

            <Field label="Browser title">
              <Text value={site.title} onChange={(value) => update(['site', 'title'], value)} />
            </Field>

            <ImageField
              label="Background image"
              value={site.backgroundImage}
              onChange={(value) => update(['site', 'backgroundImage'], value)}
              hint="Upload a photo, pick one from the library, or type a path like /images/punk2.png"
              repoImages={repoImages}
            />

            <Field label="Navigation links">
              <ListEditor
                items={navLinks}
                primaryKey="label"
                secondaryKey="href"
                primaryLabel="Label"
                secondaryLabel="Link target (e.g. #about)"
                makeItem={() => ({ label: 'New link', href: '#home' })}
                onChange={(next) => update(['site', 'navLinks'], next)}
              />
            </Field>

            <h3 className="adm-subtitle">Visibility</h3>

            <Toggle
              label="Show footer"
              checked={site.showFooter !== false}
              onChange={(value) => update(['site', 'showFooter'], value)}
              hint="The copyright bar at the bottom of the page"
            />

            <Toggle
              label="Show admin link in footer"
              checked={Boolean(site.showAdminLink)}
              onChange={(value) => update(['site', 'showAdminLink'], value)}
              hint="Off by default so visitors never see a link to the admin page"
            />

            <Field
              label="Admin page address"
              hint={`Your admin page is at yoursite.com/#${site.adminPath || 'admin'}. Change this to make it harder to find. You can always press Ctrl+Shift+A to open it.`}
            >
              <Text
                value={site.adminPath || 'admin'}
                onChange={(value) => update(['site', 'adminPath'], value.replace(/^#/, ''))}
              />
            </Field>
          </>
        )}

        {tab === 'home' && (
          <>
            <h2 className="adm-title">Hero section</h2>

            <Field label="Greeting">
              <Text value={home.greeting} onChange={(value) => update(['home', 'greeting'], value)} />
            </Field>

            <Field label="Headline">
              <Text value={home.title} onChange={(value) => update(['home', 'title'], value)} />
            </Field>

            <Field label="Description">
              <TextArea
                value={home.description}
                onChange={(value) => update(['home', 'description'], value)}
              />
            </Field>

            <Field label="Button text">
              <Text value={home.buttonText} onChange={(value) => update(['home', 'buttonText'], value)} />
            </Field>

            <Field label="Button link" hint="e.g. #skills">
              <Text value={home.buttonHref} onChange={(value) => update(['home', 'buttonHref'], value)} />
            </Field>

            <ImageField
              label="Profile image"
              value={home.image}
              onChange={(value) => update(['home', 'image'], value)}
              hint="Upload a photo, pick one from the library, or type a path like /images/Designer.png"
              repoImages={repoImages}
            />

            <Field label="Image alt text">
              <Text value={home.imageAlt} onChange={(value) => update(['home', 'imageAlt'], value)} />
            </Field>
          </>
        )}

        {tab === 'stats' && (
          <>
            <h2 className="adm-title">Statistics</h2>
            <Field label="Stat boxes">
              <ListEditor
                items={content.stats}
                primaryKey="value"
                secondaryKey="label"
                primaryLabel="Value (e.g. 3+)"
                secondaryLabel="Label (e.g. Years of Experience)"
                makeItem={() => ({ value: 'N/A', label: 'New stat' })}
                onChange={(next) => updateList(['stats'], next)}
              />
            </Field>
          </>
        )}

        {tab === 'skills' && (
          <>
            <h2 className="adm-title">Skills</h2>

            <Field label="Section heading">
              <Text value={skills.heading} onChange={(value) => update(['skills', 'heading'], value)} />
            </Field>

            <Field label="Skills">
              <ListEditor
                items={skills.items}
                primaryKey="name"
                secondaryKey="description"
                primaryLabel="Name (e.g. React)"
                secondaryLabel="Description (e.g. Frontend)"
                makeItem={() => ({ name: 'New skill', description: 'Description' })}
                onChange={(next) => update(['skills', 'items'], next)}
              />
            </Field>
          </>
        )}

        {tab === 'about' && (
          <>
            <h2 className="adm-title">About</h2>

            <Field label="Heading">
              <Text value={about.heading} onChange={(value) => update(['about', 'heading'], value)} />
            </Field>

            <Field label="Body">
              <TextArea value={about.body} onChange={(value) => update(['about', 'body'], value)} rows={7} />
            </Field>
          </>
        )}

        {tab === 'contact' && (
          <>
            <h2 className="adm-title">Contact</h2>

            <Field label="Heading">
              <Text value={contact.heading} onChange={(value) => update(['contact', 'heading'], value)} />
            </Field>

            <Field label="Contact details">
              <ListEditor
                items={contact.items}
                primaryKey="label"
                secondaryKey="value"
                primaryLabel="Label (e.g. Email)"
                secondaryLabel="Value (e.g. me@example.com)"
                makeItem={() => ({ label: 'New', value: '' })}
                onChange={(next) => update(['contact', 'items'], next)}
              />
            </Field>
          </>
        )}

        {tab === 'settings' && (
          <>
            <h2 className="adm-title">Settings</h2>

            <h3 className="adm-subtitle">Change password</h3>
            <Field label="Current password">
              <Text
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Current password"
              />
            </Field>
            <Field label="New password">
              <Text value={newPassword} onChange={setNewPassword} placeholder="New password" />
            </Field>
            <button type="button" className="adm-primary" onClick={handleChangePassword}>
              Update password
            </button>
            {passwordMessage ? <p className="adm-hint">{passwordMessage}</p> : null}

            <h3 className="adm-subtitle">GitHub</h3>
            <p className="adm-hint">
              Connect a repository so you can publish straight from here. Uploads are committed as
              real files and your site updates on the next deploy. You need a fine-grained token
              with <strong>Contents: Read and write</strong> on the repository.
            </p>

            <Field label="Owner">
              <Text value={github.owner} onChange={(value) => updateGithub('owner', value)} />
            </Field>

            <Field label="Repository">
              <Text value={github.repo} onChange={(value) => updateGithub('repo', value)} />
            </Field>

            <Field label="Branch">
              <Text value={github.branch} onChange={(value) => updateGithub('branch', value)} />
            </Field>

            <Field label="content.json path">
              <Text
                value={github.contentPath}
                onChange={(value) => updateGithub('contentPath', value)}
              />
            </Field>

            <Field label="Images folder">
              <Text
                value={github.imagesPath}
                onChange={(value) => updateGithub('imagesPath', value)}
              />
            </Field>

            <Field label="Access token">
              <input
                type="password"
                className="adm-input"
                placeholder="github_pat_..."
                value={github.token}
                onChange={(event) => updateGithub('token', event.target.value)}
              />
            </Field>

            <div className="adm-btn-row">
              <button type="button" className="adm-secondary" onClick={handleSaveGithub}>
                Save settings
              </button>
              <button type="button" className="adm-secondary" onClick={handleConnectGithub}>
                Test connection
              </button>
              <button type="button" className="adm-secondary" onClick={loadRepoImages}>
                Load image library
              </button>
              <button
                type="button"
                className="adm-secondary"
                onClick={() => {
                  clearGithubSettings()
                  setGithub(loadGithubSettings())
                  setRepoImages([])
                  setGithubStatus('GitHub settings cleared.')
                }}
              >
                Disconnect
              </button>
            </div>

            {githubStatus ? <p className="adm-hint">{githubStatus}</p> : null}

            <div className="adm-btn-row">
              <button
                type="button"
                className="adm-primary"
                onClick={handleSyncGithub}
                disabled={syncing}
              >
                {syncing ? 'Syncing...' : 'Push to GitHub'}
              </button>
              <button type="button" className="adm-secondary" onClick={handlePullGithub}>
                Pull from GitHub
              </button>
            </div>

            <h3 className="adm-subtitle">Data</h3>
            <p className="adm-hint">
              Export downloads a content.json you can drop into <code>src/content/</code> to make the
              changes permanent for every visitor. Import does the reverse.
            </p>
            <div className="adm-btn-row">
              <button type="button" className="adm-secondary" onClick={handleExport}>
                Export content.json
              </button>
              <button type="button" className="adm-secondary" onClick={() => fileInput.current?.click()}>
                Import content.json
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={handleImport}
              />
            </div>
          </>
        )}
      </>
  )

  return (
    <div className="admin">
      <header className="adm-header">
        <a href="/" className="adm-brand">
          Portfolio admin
        </a>

        <div className="adm-header-actions">
          {dirty ? <span className="adm-badge">Unsaved changes</span> : null}
          {message ? <span className="adm-toast">{message}</span> : null}
          <button type="button" className="adm-secondary" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
          <a href="/" className="adm-secondary adm-link">
            View site
          </a>
          <button type="button" className="adm-secondary" onClick={handleDiscard}>
            Discard
          </button>
          <button type="button" className="adm-primary" onClick={handlePublish}>
            Publish
          </button>
          <button
            type="button"
            className="adm-secondary adm-github"
            onClick={handleSyncGithub}
            disabled={syncing}
            title="Commit images and content.json to GitHub"
          >
            {syncing ? 'Pushing...' : 'Push to GitHub'}
          </button>
          <button type="button" className="adm-secondary adm-danger-outline" onClick={handleReset}>
            Reset
          </button>
          <button
            type="button"
            className="adm-secondary"
            onClick={() => {
              logout()
              if (onSignOut) onSignOut()
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="adm-body">
        <nav className="adm-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`adm-tab ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="adm-main">
          <div className="adm-panel">{panels}</div>
        </main>

        {showPreview ? (
          <LivePreview content={content} />
        ) : null}
      </div>
    </div>
  )
}

export default function Admin({ onSignOut }) {
  // The admin panel only ever renders once the user has signed in. The
  // routing layer in App.jsx sends unauthenticated visitors to the sign-in
  // page first, so this is a safety net rather than the main gate.
  if (!isAuthenticated()) return null

  return <AdminPanel onSignOut={onSignOut} />
}
