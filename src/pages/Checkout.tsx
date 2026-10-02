import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart, getCartTotal, clearCart, getCoupon, couponDiscount } from '../lib/cart'
import { supabase } from '../lib/supabase'
import { useL } from '../lib/settings'

export default function Checkout() {
  const { t, fmt, lang, cities } = useL()
  const navigate = useNavigate()
  const items = getCart()
  const subtotal = getCartTotal()
  const discount = couponDiscount(subtotal)
  const total = Math.max(subtotal - discount, 0)
  const coupon = getCoupon()

  useEffect(() => { if (items.length === 0) navigate('/cart') }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const btn = e.currentTarget.querySelector('.pay-btn') as HTMLButtonElement
    btn.disabled = true; btn.textContent = t('checkout.paying')
    const fd = new FormData(e.currentTarget)
    const rpcPayload = {
      p_items: items.map(i => ({ key: i.key, productId: i.productId, name_ar: i.name_ar, name_en: i.name_en, weight: i.weight, price: i.price, qty: i.qty, note: i.note ?? null })),
      p_total: total,
      p_coupon: coupon?.code ?? null,
      p_name: fd.get('name') as string,
      p_phone: fd.get('phone') as string,
      p_city: fd.get('city') as string,
      p_address: fd.get('address') as string,
      p_notes: (fd.get('notes') as string) ?? ''
    }
    try {
      const { data, error } = await supabase.rpc('place_order', rpcPayload)
      if (!error && data) { clearCart(); navigate('/success?id=' + data); return }
      if (error) throw new Error(error.message)
      const orderData = {
        items, total,
        coupon: coupon ?? null,
        shipping_name: rpcPayload.p_name,
        shipping_phone: rpcPayload.p_phone,
        shipping_city: rpcPayload.p_city,
        shipping_address: rpcPayload.p_address,
        shipping_notes: rpcPayload.p_notes,
        payment_method: 'cod'
      }
      const resp = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) })
      const data2 = await resp.json()
      if (!data2.success) throw new Error()
      clearCart(); navigate('/success?id=' + data2.orderId)
    } catch {
      toast(t('checkout.error'))
      btn.disabled = false; btn.textContent = t('checkout.pay')
    }
  }

  return (
    <main className="checkout-page">
      <div className="container">
        <h2 className="section-title">{t('checkout.title')}</h2>
        <div className="checkout-grid">
          <div className="checkout-form-card">
            <h3>{t('checkout.shipTitle')}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>{t('checkout.name')}</label><input type="text" name="name" className="form-input" required placeholder={t('checkout.namePh')} /></div>
              <div className="form-group"><label>{t('checkout.phone')}</label><PhoneInput /></div>
              <div className="form-group"><label>{t('checkout.city')}</label>
                <select name="city" className="form-input" required>
                  <option value="">{t('checkout.cityPh')}</option>
                  {cities.map(c => <option key={c.en}>{lang === 'ar' ? c.ar : c.en}</option>)}
                </select>
              </div>
              <div className="form-group"><label>{t('checkout.address')}</label><input type="text" name="address" className="form-input" required placeholder={t('checkout.addressPh')} /></div>
              <div className="form-group"><label>{t('checkout.notes')}</label><input type="text" name="notes" className="form-input" placeholder={t('checkout.notesPh')} /></div>
              <div className="order-total-bar">
                <span>{t('checkout.total')}</span>
                <span className="order-total-value">{fmt(total)}</span>
              </div>
              {coupon && <div className="order-review-note">{t('cart.discount')} {coupon.code} ({coupon.percent}%): -{fmt(discount)}</div>}
              <button type="submit" className="pay-btn">{t('checkout.pay')}</button>
            </form>
          </div>
          <div className="cart-summary">
            <h3>{t('checkout.summary')}</h3>
            {items.map(i => (
              <div key={i.key}>
                <div className="order-review-item"><span>{lang === 'ar' ? i.name_ar : i.name_en} × {i.qty}</span><span>{fmt(i.price * i.qty)}</span></div>
                {i.note && <div className="order-review-note">{t('checkout.note')}: {i.note}</div>}
              </div>
            ))}
            <div className="order-review-item" style={{ borderTop: '1px solid rgba(46,56,38,.08)', marginTop: 10, paddingTop: 10, fontWeight: 700 }}>
              <span>{t('cart.subtotal')}</span><span>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="order-review-item"><span>{t('cart.discount')}</span><span style={{ color: 'var(--gold-deep)' }}>-{fmt(discount)}</span></div>
            )}
            <div className="order-review-item"><span>{t('cart.shipping')}</span><span style={{ color: 'var(--olive)' }}>{t('cart.free')}</span></div>
            <div className="order-review-item" style={{ fontWeight: 700, fontSize: 16 }}>
              <span>{t('cart.total')}</span><span style={{ color: 'var(--gold-deep)' }}>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function toast(msg: string) {
  let el = document.querySelector('.toast') as HTMLDivElement
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el) }
  el.textContent = msg; el.classList.add('show')
  setTimeout(() => el.classList.remove('show'), 2000)
}

const CountryFlag = ({ c }: { c: typeof GCC[number] }) => {
  switch (c.key) {
    case 'OM':
      return (
        <svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff" /><rect y="13.3" width="60" height="13.4" fill="#E23D28" /><rect y="26.6" width="60" height="13.4" fill="#2F7A3C" /><rect width="15" height="40" fill="#E23D28" /></svg>
      )
    case 'SA':
      return (
        <svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#0B6B3C" /><text x="30" y="16" fontSize="7.5" fill="#fff" textAnchor="middle" fontFamily="serif">لا إله إلا الله</text><text x="30" y="27" fontSize="7.5" fill="#fff" textAnchor="middle" fontFamily="serif">محمد رسول الله</text><rect x="27.5" y="29" width="5" height="7" fill="#fff" /></svg>
      )
    case 'AE':
      return (
        <svg viewBox="0 0 60 40"><rect y="13.4" width="60" height="13.3" fill="#fff" /><rect width="60" height="13.3" fill="#0A5B33" /><rect y="26.7" width="60" height="13.3" fill="#0A0A0A" /><rect width="15" height="40" fill="#CC1111" /></svg>
      )
    case 'KW':
      return (
        <svg viewBox="0 0 60 40"><rect width="60" height="13.3" fill="#0A5B33" /><rect y="13.3" width="60" height="13.4" fill="#fff" /><rect y="26.7" width="60" height="13.3" fill="#CC1111" /><path d="M0 0 L15 20 L0 40 Z" fill="#0A0A0A" /></svg>
      )
    case 'QA':
      return (
        <svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#8D1B3D" /><path d="M15 0 H0 L6 2.5 L0 5 L6 7.5 L0 10 L6 12.5 L0 15 L6 17.5 L0 20 L6 22.5 L0 25 L6 27.5 L0 30 L6 32.5 L0 35 L6 37.5 L0 40 H15 Z" fill="#fff" /></svg>
      )
    default:
      return (
        <svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#D11" /><path d="M15 0 H0 L6 4 L0 8 L6 12 L0 16 L6 20 L0 24 L6 28 L0 32 L6 36 L0 40 H15 Z" fill="#fff" /><rect x="15" width="45" height="40" fill="#D11" /></svg>
      )
  }
}

const GCC = [
  { key: 'OM' as const, dial: '+968', digits: 8, name_ar: 'عُمان', name_en: 'Oman' },
  { key: 'SA' as const, dial: '+966', digits: 9, name_ar: 'السعودية', name_en: 'Saudi Arabia' },
  { key: 'AE' as const, dial: '+971', digits: 9, name_ar: 'الإمارات', name_en: 'UAE' },
  { key: 'KW' as const, dial: '+965', digits: 8, name_ar: 'الكويت', name_en: 'Kuwait' },
  { key: 'QA' as const, dial: '+974', digits: 8, name_ar: 'قطر', name_en: 'Qatar' },
  { key: 'BH' as const, dial: '+973', digits: 8, name_ar: 'البحرين', name_en: 'Bahrain' },
]

function PhoneInput() {
  const { t, lang } = useL()
  const [ci, setCi] = useState(0)
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="phone-box" ref={boxRef}>
      <button type="button" className={`phone-cc ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="phone-flag"><CountryFlag c={GCC[ci]} /></span>
        <span className="phone-dial">{GCC[ci].dial}</span>
        <span className="phone-caret">▾</span>
      </button>
      <input type="tel" className="form-input phone-number" inputMode="numeric" dir="ltr"
        placeholder={t('checkout.phonePh')} value={val}
        maxLength={GCC[ci].digits}
        onChange={e => setVal(e.target.value.replace(/\D/g, ''))} />
      <input type="hidden" name="phone" value={GCC[ci].dial + val} />
      {open && (
        <div className="phone-cc-list">
          {GCC.map((c, i) => (
            <button type="button" key={c.key} className={`phone-cc-item ${i === ci ? 'selected' : ''}`} onClick={() => { setCi(i); setVal(''); setOpen(false) }}>
              <span className="phone-flag"><CountryFlag c={c} /></span>
              <span className="phone-cc-name">{lang === 'ar' ? c.name_ar : c.name_en}</span>
              <span className="phone-cc-dial">{c.dial}</span>
            </button>
          ))}
        </div>
      )}
      <div className="phone-hint">{t('checkout.phoneDigits').replace('{n}', String(GCC[ci].digits))}</div>
    </div>
  )
}