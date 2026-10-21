import { useContent } from '../context/useContent'

// Resolved once at module load so the footer stays stable across re-renders.
const YEAR = new Date().getFullYear()

function Footer() {
  const { content } = useContent()
  const { showFooter = true, showAdminLink = false, adminPath = 'admin' } = content.site

  if (!showFooter) return null

  return (
    <footer className="site-footer">
      <p>
        &copy; {YEAR} {content.site.logo}
      </p>
      {showAdminLink ? (
        <a href={`#${adminPath}`} className="admin-link">
          Admin
        </a>
      ) : null}
    </footer>
  )
}

export default Footer
