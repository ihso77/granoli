import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCartCount, onCartChange } from '../lib/cart'
import { supabase } from '../lib/supabase'
import { useL, CURRENCIES, type Currency } from '../lib/settings'
import type { User } from '@supabase/supabase-js'

interface Profile { is_admin: boolean; full_name: string; avatar_url: string | null }

export default function Header() {
  const { t, lang, setLang, currency, auto, setCurrency, setAuto } = useL()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const setRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setCartCount(getCartCount())
    return onCartChange(() => setCartCount(getCartCount()))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      if (data.session?.user) loadProfile(data.session.user.id)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const u = s?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
      else setProfile(null)
      if (s) setProfileOpen(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); setSettingsOpen(false) }, [location])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const tgt = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(tgt)) setProfileOpen(false)
      if (setRef.current && !setRef.current.contains(tgt)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadProfile = async (uid: string) => {
    try {
      const { data } = await supabase.from('profiles').select('is_admin, full_name, avatar_url').eq('id', uid).single()
      setProfile(data as Profile ?? null)
    } catch { setProfile(null) }
  }

  const initials = (profile?.full_name || user?.email || '؟').split(' ').map(w => w[0]).slice(0, 2).join('')
  const isAdmin = !!profile?.is_admin

  return (
    <>
      <header className={`header ${scrolled || !isHome ? 'scrolled' : ''}`}>
        <div className="header-inner">
          <Link className="logo" to="/">
            <svg viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="16" rx="9" ry="14" transform="rotate(-12 16 16)" stroke="currentColor" strokeWidth="1.8" fill="rgba(211,167,92,.25)"/><line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="1" opacity=".5"/></svg>
            <span>GRANOLI</span>
          </Link>

          <div className="nav-links">
            <Link to="/">{t('nav.home')}</Link>
            <Link to="/products">{t('nav.products')}</Link>
            <Link to="/#contact">{t('nav.contact')}</Link>
            {isAdmin && (
              <Link to="/admin" style={{ color: 'var(--gold)', fontWeight: 500 }}>{t('nav.admin')}</Link>
            )}
            <Link to="/cart" className="nav-cart">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {cartCount > 0 && <span className="cart-count show">{cartCount}</span>}
            </Link>

            <div className="profile-wrap" ref={setRef}>
              <button className="settings-btn" onClick={() => setSettingsOpen(s => !s)} aria-label={t('nav.settings')} title={t('nav.settings')}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </button>
              {settingsOpen && (
                <div className="profile-dropdown settings-dropdown">
                  <div className="profile-dd-head" style={{ paddingBottom: 8 }}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#A97C3A" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                    <div>
                      <div className="profile-dd-name">{t('settings.title')}</div>
                      <div className="profile-dd-email">GRANOLI</div>
                    </div>
                  </div>
                  <div className="profile-dd-divider" />
                  <div className="settings-row">
                    <span>{t('settings.lang')}</span>
                    <div className="lang-toggle">
                      <button className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>العربية</button>
                      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
                    </div>
                  </div>
                  <div className="settings-row">
                    <span>{t('settings.currency')}</span>
                    <select className="currency-select" value={currency} onChange={e => { const v = e.target.value; if (v === '__auto') setAuto(true); else setCurrency(v as Currency) }}>
                      {!auto && <option value="__auto">{t('settings.auto')}</option>}
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {!auto && (
                    <button className="settings-auto" onClick={() => setAuto(true)}>{t('settings.auto')} ✓</button>
                  )}
                </div>
              )}
            </div>

            {user ? (
              <div className="profile-wrap" ref={dropdownRef}>
                <button className="profile-avatar" onClick={() => setProfileOpen(p => !p)} aria-label={t('nav.account')}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="profile-initials">{initials}</span>
                  )}
                </button>
                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dd-head">
                      <div className="profile-dd-avatar">
                        {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{initials}</span>}
                      </div>
                      <div>
                        <div className="profile-dd-name">{profile?.full_name || user.email}</div>
                        <div className="profile-dd-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="profile-dd-divider" />
                    {isAdmin && <Link to="/admin" className="profile-dd-item" style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>{t('nav.admin')}</Link>}
                    <Link to="/cart" className="profile-dd-item">{t('nav.orders')}</Link>
                    <button className="profile-dd-item" onClick={async () => { await supabase.auth.signOut(); navigate('/') }}>{t('nav.logout')}</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-gold" style={{ padding: '8px 20px', fontSize: '12.5px' }}>{t('nav.login')}</Link>
            )}
          </div>

          <button className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label={t('nav.menu')}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'active' : ''}`}>
        <Link to="/">{t('nav.home')}</Link>
        <Link to="/products">{t('nav.products')}</Link>
        <Link to="/#contact">{t('nav.contact')}</Link>
        <Link to="/cart">{t('nav.cartLabel')}</Link>
        {isAdmin && <Link to="/admin" style={{ color: 'var(--gold)' }}>{t('nav.admin')}</Link>}
        {user ? (
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/') }} style={{ fontFamily: lang === 'en' ? "'Outfit',sans-serif" : "'El Messiri',serif", fontSize: 26, color: 'var(--cream)' }}>{t('nav.logout')}</button>
        ) : (
          <Link to="/login">{t('nav.login')}</Link>
        )}
      </div>
    </>
  )
}