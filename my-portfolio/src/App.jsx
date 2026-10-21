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

function Portfolio() {
  const { content } = useContent()

  useEffect(() => {
    document.title = content.site.title
    document.body.style.backgroundImage = content.site.backgroundImage
      ? `url("${assetUrl(content.site.backgroundImage)}")`
      : ''
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
