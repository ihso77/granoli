import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useL } from '../lib/settings'

export default function Success() {
  const { t } = useL()
  useEffect(() => { localStorage.removeItem('lastOrder') }, [])
  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#D3A75C" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1>{t('success.title')}</h1>
        <p>{t('success.sub')}</p>
        <Link to="/" className="btn-gold" style={{ fontSize: 15, padding: '12px 32px' }}>{t('success.back')}</Link>
      </div>
    </div>
  )
}