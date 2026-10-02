import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart, getCartTotal, clearCart, getCoupon, couponDiscount } from '../lib/cart'
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
    const orderData = {
      items, total,
      coupon: coupon ?? null,
      shipping_name: fd.get('name') as string,
      shipping_phone: fd.get('phone') as string,
      shipping_city: fd.get('city') as string,
      shipping_address: fd.get('address') as string,
      shipping_notes: fd.get('notes') as string,
      payment_method: 'cod'
    }
    try {
      const resp = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) })
      const data = await resp.json()
      if (data.success) { clearCart(); navigate('/success?id=' + data.orderId) }
      else throw new Error()
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
              <div className="form-row">
                <div className="form-group"><label>{t('checkout.phone')}</label><input type="tel" name="phone" className="form-input" required placeholder={t('checkout.phonePh')} /></div>
                <div className="form-group"><label>{t('checkout.city')}</label>
                  <select name="city" className="form-input" required>
                    <option value="">{t('checkout.cityPh')}</option>
                    {cities.map(c => <option key={c.en}>{lang === 'ar' ? c.ar : c.en}</option>)}
                  </select>
                </div>
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