import { Link } from 'react-router-dom'
import { useL } from '../lib/settings'

export default function Footer() {
  const { t } = useL()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-logo">
          <svg viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="24" rx="13" ry="20" transform="rotate(-12 24 24)" stroke="#D3A75C" strokeWidth="2" fill="rgba(211,167,92,.1)"/><line x1="24" y1="8" x2="24" y2="40" stroke="#D3A75C" strokeWidth="1" opacity=".35"/></svg>
        </div>
        <p className="footer-tagline">{t('footer.tagline')}</p>
        <div className="social-links">
          <a href="#" className="social-link" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8" fill="none"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg></a>
          <a href="#" className="social-link" aria-label="X"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="currentColor"/></svg></a>
        </div>
        <p className="footer-copy">© 2026 <Link to="/">GRANOLI</Link>. {t('footer.rights')}</p>
      </div>
    </footer>
  )
}