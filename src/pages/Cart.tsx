import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCart, updateQty, removeFromCart, applyCoupon, getCoupon, setCoupon, couponDiscount, type Coupon } from '../lib/cart'
import { useL } from '../lib/settings'

export default function Cart() {
  const { t, fmt, lang } = useL()
  const [items, setItems] = useState(getCart())
  const [code, setCode] = useState('')
  const [coupon, setCouponState] = useState<Coupon | null>(getCoupon())
  const [checking, setChecking] = useState(false)
  const refresh = () => setItems(getCart())

  useEffect(() => { refresh() }, [])

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = couponDiscount(subtotal)
  const total = subtotal - discount

  const apply = async () => {
    if (!code.trim()) return
    setChecking(true)
    const c = await applyCoupon(code)
    setChecking(false)
    if (c) { setCoupon(c); setCouponState(c); toast(t('cart.couponApplied')) }
    else toast(t('cart.couponInvalid'))
  }

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <div className="container">
          <h2 className="section-title" style={{ marginBottom: 40 }}>{t('cart.title')}</h2>
          <div className="cart-empty">
            <p>{t('cart.empty')}</p>
            <Link to="/products" className="btn-gold">{t('cart.browse')}</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <div className="container">
        <h2 className="section-title" style={{ marginBottom: 40 }}>{t('cart.title')}</h2>
        <div className="cart-grid">
          <div>
            <div className="cart-items">
              {items.map(i => (
                <div key={i.key} className="cart-item">
                  <div className="cart-item-img">
                    <svg viewBox="0 0 40 40" fill="none"><ellipse cx="20" cy="20" rx="9" ry="14" transform="rotate(-12 20 20)" stroke="#D3A75C" strokeWidth="1.8" fill="rgba(211,167,92,.12)"/></svg>
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{lang === 'ar' ? i.name_ar : i.name_en}</div>
                    <div className="cart-item-weight">{i.weight}</div>
                    {i.note && <div className="cart-item-note">{i.note}</div>}
                    <div className="cart-item-price">{fmt(i.price)}</div>
                    <button className="cart-item-remove" onClick={() => { removeFromCart(i.key); refresh() }}>{t('cart.remove')}</button>
                  </div>
                  <div className="cart-qty">
                    <button onClick={() => { updateQty(i.key, i.qty - 1); refresh() }}>−</button>
                    <span>{i.qty}</span>
                    <button onClick={() => { updateQty(i.key, i.qty + 1); refresh() }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {!coupon ? (
              <div className="coupon-box">
                <input value={code} onChange={e => setCode(e.target.value)} className="form-input" placeholder={t('cart.couponPh')} dir="auto" />
                <button className="coupon-btn" onClick={apply} disabled={checking}>{checking ? '...' : t('cart.couponApply')}</button>
              </div>
            ) : (
              <div className="coupon-applied">{t('cart.couponApplied')} — {coupon.code} ({coupon.percent}%)
                <button onClick={() => { setCoupon(null); setCouponState(null) }}>×</button>
              </div>
            )}
          </div>

          <div className="cart-summary">
            <h3>{t('cart.title')}</h3>
            <div className="cart-summary-row"><span>{t('cart.productsCount')}</span><span>{items.length} {t('cart.productsCount')}</span></div>
            <div className="cart-summary-row"><span>{t('cart.subtotal')}</span><span>{fmt(subtotal)}</span></div>
            {discount > 0 && (
              <div className="cart-summary-row discount"><span>{t('cart.discount')} ({coupon?.code})</span><span>-{fmt(discount)}</span></div>
            )}
            <div className="cart-summary-row"><span>{t('cart.shipping')}</span><span style={{ color: 'var(--olive)' }}>{t('cart.free')}</span></div>
            <div className="cart-summary-row total"><span>{t('cart.total')}</span><span>{fmt(Math.max(total, 0))}</span></div>
            <Link to="/checkout" className="cart-checkout-btn">{t('cart.checkout')}</Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function toast(msg: string) {
  let t = document.querySelector('.toast') as HTMLDivElement
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t) }
  t.textContent = msg; t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2000)
}