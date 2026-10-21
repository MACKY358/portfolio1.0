import { useContent } from '../context/useContent'

function Navbar() {
  const { content } = useContent()
  const { site } = content

  return (
    <header>
      <a href="#home" className="logo">
        {site.logo}
      </a>

      <nav className="navbar">
        {site.navLinks.map((link, index) => (
          <a
            key={`${link.label}-${index}`}
            href={link.href}
            className={link.button ? 'button' : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

export default Navbar
