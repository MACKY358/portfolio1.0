import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Experiences from './components/Experiences'
import Skills from './components/Skills'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Admin from './components/Admin'
import Login from './components/Login'
import { useContent } from './context/useContent'
import { assetUrl } from './lib/assets'
import { isAuthenticated } from './lib/contentStore'

const LOGIN_PATH = 'login'
const MOBILE_BACKGROUND_QUERY = '(max-width: 768px)'

/**
 * Custom properties holding a url() are resolved against the stylesheet that
 * consumes them, not against the page. Absolute URLs keep the background
 * pointing at the real file.
 */
function toAbsoluteUrl(path) {
  try {
    return new URL(path, document.baseURI).href
  } catch {
    return path
  }
}

function Portfolio() {
  const { content } = useContent()

  useEffect(() => {
    document.title = content.site.title

    const root = document.documentElement
    const path = content.site.backgroundImage

    if (!path) {
      root.style.removeProperty('--site-bg-desktop')
      root.style.removeProperty('--site-bg-mobile')
      return
    }

    const desktop = toAbsoluteUrl(assetUrl(path))
    const desktopUrl = `url("${desktop}")`
    const query = window.matchMedia(MOBILE_BACKGROUND_QUERY)

    const showDesktop = () => {
      root.style.setProperty('--site-bg-desktop', desktopUrl)
      root.style.removeProperty('--site-bg-mobile')
    }

    // Uploaded images are data URLs and have no sibling crop.
    if (/^data:/i.test(desktop)) {
      showDesktop()
      return
    }

    // Phones get a portrait crop (punk2.webp -> punk2-mobile.webp) so the
    // landscape image is not zoomed into a strip. It is only requested on
    // small screens, and a missing crop falls back to the desktop image, so
    // images added through the admin keep working.
    const mobile = desktop.replace(/(\.[a-z0-9]+)$/i, '-mobile$1')
    let probe = null
    let cropReady = false
    let cancelled = false

    const showCrop = () => {
      if (cropReady) {
        root.style.setProperty('--site-bg-mobile', `url("${mobile}")`)
        root.style.removeProperty('--site-bg-desktop')
        return
      }
      if (probe || cancelled) return

      probe = new Image()
      probe.onload = () => {
        if (cancelled) return
        cropReady = true
        root.style.setProperty('--site-bg-mobile', `url("${mobile}")`)
        root.style.removeProperty('--site-bg-desktop')
      }
      probe.onerror = () => {
        if (!cancelled) showDesktop()
      }
      probe.src = mobile
    }

    const sync = () => {
      if (query.matches) showCrop()
      else showDesktop()
    }

    sync()
    query.addEventListener('change', sync)
    return () => {
      cancelled = true
      query.removeEventListener('change', sync)
    }
  }, [content.site.title, content.site.backgroundImage])

  return (
    <>
      <Navbar />
      <Home />
      <Experiences />
      <Skills />
      <About />
      <Contact />
      <Footer />
    </>
  )
}

function App() {
  const { content } = useContent()
  const adminPath = content.site.adminPath || 'admin'
  const [authed, setAuthed] = useState(() => isAuthenticated())

  const [route, setRoute] = useState(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/admin') return 'admin'
    return window.location.hash.replace(/^#\/?/, '')
  })

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
        setRoute('admin')
        return
      }
      setRoute(window.location.hash.replace(/^#\/?/, ''))
    }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('popstate', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('popstate', onHashChange)
    }
  }, [])

  // The admin panel is only reachable after signing in. Anyone who opens the
  // admin address directly is sent to the sign-in page first.
  const wantsAdmin = route === adminPath || route === 'admin'
  const authenticated = authed && isAuthenticated()
  const currentRoute = wantsAdmin && !authenticated ? LOGIN_PATH : route

  useEffect(() => {
    if (wantsAdmin && !authenticated) {
      window.location.hash = `#${LOGIN_PATH}`
    }
  }, [wantsAdmin, authenticated])

  // Ctrl+Shift+A opens the admin panel without leaving a visible link.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!event.ctrlKey || !event.shiftKey) return
      if (event.key.toLowerCase() !== 'a') return
      event.preventDefault()
      window.location.hash = `#${isAuthenticated() ? adminPath : LOGIN_PATH}`
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [adminPath])

  const signIn = () => {
    setAuthed(true)
    window.location.hash = `#${adminPath}`
    setRoute(adminPath)
  }

  const signOut = () => {
    setAuthed(false)
    window.location.hash = `#${LOGIN_PATH}`
    setRoute(LOGIN_PATH)
  }

  if (currentRoute === LOGIN_PATH) {
    return <Login onLogin={signIn} redirectTo={adminPath} />
  }

  if (wantsAdmin) {
    if (!authenticated) return null
    return <Admin onSignOut={signOut} />
  }

  return <Portfolio />
}

export default App
