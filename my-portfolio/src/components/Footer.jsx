import { useContent } from '../context/useContent'

// Resolved once at module load so the footer stays stable across re-renders.
const YEAR = new Date().getFullYear()

function Footer() {
  const { content } = useContent()

  return (
    <footer className="site-footer">
      <p>
        &copy; {YEAR} {content.site.logo}
      </p>
      <a href="#admin" className="admin-link">
        Admin
      </a>
    </footer>
  )
}

export default Footer
