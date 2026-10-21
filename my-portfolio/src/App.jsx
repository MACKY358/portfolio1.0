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
import { useContent } from './context/useContent'

function Portfolio() {
  const { content } = useContent()

  useEffect(() => {
    document.title = content.site.title
    document.body.style.backgroundImage = content.site.backgroundImage
      ? `url("${content.site.backgroundImage}")`
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

  if (route === 'admin') {
    return <Admin />
  }

  return <Portfolio />
}

export default App
