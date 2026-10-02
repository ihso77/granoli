import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email') as string, password: fd.get('password') as string })
    setLoading(false)
    if (error) { setError(error.message) } else { navigate('/') }
  }

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string; const email = fd.get('email') as string; const password = fd.get('password') as string
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (!error && data.user) { await supabase.from('profiles').upsert({ id: data.user.id, full_name: name }) }
    setLoading(false)
    if (error) { setError(error.message) } else { navigate('/') }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 80 80" fill="none"><ellipse cx="40" cy="40" rx="22" ry="34" transform="rotate(-12 40 40)" stroke="#D3A75C" strokeWidth="2.5" fill="rgba(211,167,92,.08)"/><line x1="40" y1="12" x2="40" y2="68" stroke="#D3A75C" strokeWidth="1.2" opacity=".35"/></svg>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError('') }}>تسجيل الدخول</button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError('') }}>حساب جديد</button>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className={`auth-error ${error ? 'show' : ''}`}>{error}</div>
            <div className="form-group"><label>البريد الإلكتروني</label><input type="email" name="email" className="form-input" placeholder="email@example.com" required /></div>
            <div className="form-group"><label>كلمة المرور</label><input type="password" name="password" className="form-input" placeholder="••••••••" required minLength={6} /></div>
            <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'جاري...' : 'تسجيل الدخول'}</button>
            <Link to="/" className="auth-back">العودة للمتجر</Link>
          </form>
        )}

        {tab === 'signup' && (
          <form onSubmit={handleSignup}>
            <div className={`auth-error ${error ? 'show' : ''}`}>{error}</div>
            <div className="form-group"><label>الاسم الكامل</label><input type="text" name="name" className="form-input" placeholder="اسمك هنا" required /></div>
            <div className="form-group"><label>البريد الإلكتروني</label><input type="email" name="email" className="form-input" placeholder="email@example.com" required /></div>
            <div className="form-group"><label>كلمة المرور</label><input type="password" name="password" className="form-input" placeholder="6 أحرف على الأقل" required minLength={6} /></div>
            <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'جاري...' : 'إنشاء حساب'}</button>
            <Link to="/" className="auth-back">العودة للمتجر</Link>
          </form>
        )}
      </div>
    </div>
  )
}