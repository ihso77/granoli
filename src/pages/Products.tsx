import { useState, useEffect } from 'react'
import { addToCart } from '../lib/cart'
import { fetchProducts, isGranola, type Product } from '../lib/products'
import { useL } from '../lib/settings'

function toast(msg: string, type?: 'soldout') {
  let t = document.querySelector('.toast') as HTMLDivElement
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t) }
  t.textContent = msg; t.classList.add('show')
  if (type) t.classList.add(type)
  setTimeout(() => t.classList.remove('show', 'soldout'), 2600)
}

interface BoxFlavor { flavor: string; name_ar: string; name_en: string; color: string }

const BOX_FLAVORS: BoxFlavor[] = [
  { flavor: 'classic', name_ar: 'كلاسيك', name_en: 'CLASSIC', color: '#4B5940' },
  { flavor: 'orchard', name_ar: 'أورتشارد', name_en: 'ORCHARD', color: '#A97C3A' },
  { flavor: 'bloom', name_ar: 'ويلد بلوم', name_en: 'WILD BLOOM', color: '#6B5A47' },
  { flavor: 'pecan', name_ar: 'غولدن بِيكان', name_en: 'GOLDEN PECAN', color: '#8A6D3B' },
]

/* اصنع صندوقك — صندوق الديلي 12×40جم */
export function BuildBox({ daily }: { daily: Product }) {
  const { t, fmt, lang } = useL()
  const [qty, setQty] = useState<number[]>([0, 0, 0, 0])
  const [added, setAdded] = useState(false)
  const price = daily.price_daily ?? 5
  const totalUnits = qty.reduce((s, n) => s + n, 0)
  const selected = totalUnits * 3
  const complete = selected === 12

  const setQ = (i: number, v: number) => {
    const next = [...qty]
    next[i] = Math.max(0, Math.min(4 - (totalUnits - qty[i]), v))
    setQty(next)
  }

  const add = () => {
    if (daily.stock != null && daily.stock <= 0) { toast(t('products.soldOutToast'), 'soldout'); return }
    if (!complete) { toast(t('box.toastIncomplete')); return }
    const recipe = BOX_FLAVORS.map((f, i) => `${qty[i] * 3} ${lang === 'ar' ? f.name_ar : f.name_en}`).filter((_, i) => qty[i] > 0).join(' + ')
    addToCart(daily, '12×40g', price, recipe)
    setAdded(true); toast(t('box.addedToast'))
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="build-box">
      <div className="bb-head">
        <div className="bb-title-col">
          <span className="bb-kicker">{t('daily.kicker')}</span>
          <h3>{t('box.title')}</h3>
          <p className="bb-sub">{t('box.sub')}</p>
        </div>
        <div className="bb-price">
          <div className="bb-price-val">{fmt(price)}</div>
          <div className="bb-price-sub">12 × 40g</div>
          <div className="bb-price-sub">480g {t('box.total')}</div>
        </div>
      </div>

      <div className="bb-slots">
        {Array.from({ length: 12 }).map((_, s) => {
          let rem = s
          let color = ''
          for (let i = 0; i < 4; i++) {
            if (rem < qty[i] * 3) { color = BOX_FLAVORS[i].color; break }
            rem -= qty[i] * 3
          }
          return <div key={s} className={`bb-slot ${color ? 'filled' : ''}`} style={color ? { background: color } : undefined} />
        })}
      </div>
      <div className="bb-progress">
        <span className={complete ? 'ok' : ''}>
          {complete ? t('box.ready') : t('box.selected').replace('{n}', String(selected))}
        </span>
        <span className="bb-progress-bar"><span style={{ width: `${(selected / 12) * 100}%` }} /></span>
      </div>

      <div className="bb-flavors">
        {BOX_FLAVORS.map((f, i) => (
          <div className="bb-flavor" key={f.flavor}>
            <span className="bb-fl-ico" style={{ background: f.color }} />
            <div className="bb-fl-info">
              <div className="bb-fl-name">{lang === 'ar' ? f.name_ar : f.name_en}</div>
              <div className="bb-fl-en">{lang === 'ar' ? f.name_en : f.name_ar}</div>
              <div className="bb-fl-parts">{t('box.parts').replace('{n}', String(qty[i] * 3))}</div>
            </div>
            <div className="bb-stepper">
              <button type="button" onClick={() => setQ(i, qty[i] - 1)} disabled={qty[i] <= 0}>−</button>
              <span>{qty[i]}</span>
              <button type="button" onClick={() => setQ(i, qty[i] + 1)} disabled={totalUnits >= 4}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bb-foot">
        <button className={`product-btn ${added ? 'added' : ''}`} onClick={add} disabled={!complete}>
          {added ? '✓' + t('products.added') : complete ? t('box.addReady').replace('{p}', fmt(price)) : t('box.addMore')}
        </button>
      </div>
    </div>
  )
}

/* خلفيات SVG احتياطية في حال ما عند المنتج صورة */
function FallbackIcon({ flavor }: { flavor: string }) {
  switch (flavor) {
    case 'orchard':
      return <svg viewBox="0 0 120 120" fill="none"><circle cx="60" cy="64" r="28" stroke="#A97C3A" strokeWidth="2.5" fill="rgba(169,124,58,.06)"/><path d="M60 36 L60 24" stroke="#A97C3A" strokeWidth="2" opacity=".5"/><path d="M48 30 Q60 18 72 30" stroke="#A97C3A" strokeWidth="1.5" fill="none" opacity=".5"/><circle cx="50" cy="54" r="3" fill="rgba(169,124,58,.12)"/><circle cx="70" cy="60" r="2.5" fill="rgba(169,124,58,.12)"/></svg>
    case 'bloom':
      return <svg viewBox="0 0 120 120" fill="none"><circle cx="48" cy="60" r="14" stroke="#6B5A47" strokeWidth="2.5" fill="rgba(107,90,71,.06)"/><circle cx="72" cy="52" r="12" stroke="#6B5A47" strokeWidth="2" fill="rgba(107,90,71,.05)"/><circle cx="64" cy="74" r="11" stroke="#6B5A47" strokeWidth="2" fill="rgba(107,90,71,.05)"/><path d="M48 46 L48 34" stroke="#6B5A47" strokeWidth="1.2" opacity=".4"/><path d="M72 40 L72 28" stroke="#6B5A47" strokeWidth="1.2" opacity=".4"/></svg>
    case 'pecan':
      return <svg viewBox="0 0 120 120" fill="none"><ellipse cx="60" cy="64" rx="24" ry="16" stroke="#A97C3A" strokeWidth="2.5" fill="rgba(169,124,58,.08)"/><path d="M36 64 Q60 48 84 64" stroke="#A97C3A" strokeWidth="1.5" fill="none" opacity=".4"/><circle cx="60" cy="86" r="5" fill="rgba(211,167,92,.25)" stroke="#D3A75C" strokeWidth="1.5"/></svg>
    default:
      return <svg viewBox="0 0 120 120" fill="none"><ellipse cx="60" cy="60" rx="18" ry="34" transform="rotate(-12 60 60)" stroke="#4B5940" strokeWidth="2.5" fill="rgba(75,89,64,.08)"/><ellipse cx="40" cy="62" rx="14" ry="28" transform="rotate(-20 40 62)" stroke="#7C8A6C" strokeWidth="2" fill="rgba(124,138,108,.05)"/><ellipse cx="80" cy="62" rx="14" ry="28" transform="rotate(4 80 62)" stroke="#7C8A6C" strokeWidth="2" fill="rgba(124,138,108,.05)"/><line x1="60" y1="32" x2="60" y2="88" stroke="#4B5940" strokeWidth="1.2" opacity=".3"/></svg>
  }
}

export function ProductCard({ p }: { p: Product }) {
  const { t, fmt, lang } = useL()
  const [price, setPrice] = useState(p.price_250 ?? 0)
  const [weight, setWeight] = useState('250')
  const [added, setAdded] = useState(false)
  const soldOut = p.stock != null && p.stock <= 0
  const low = p.stock != null && p.stock > 0 && p.stock <= 5

  const selectWeight = (w: string) => {
    setWeight(w)
    setPrice(w === '500' ? (p.price_500 ?? p.price_250 ?? 0) : (p.price_250 ?? 0))
  }

  const handleAdd = () => {
    if (soldOut) { toast(t('products.soldOutToast'), 'soldout'); return }
    if (price <= 0) { toast(t('products.noPrice')); return }
    addToCart(p, weight + 'g', price)
    setAdded(true); toast(t('products.added'))
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="product-detail-card">
      <div className="product-visual" style={{ background: 'rgba(75,89,64,.05)' }}>
        {p.image_url ? <img src={p.image_url} alt={lang === 'ar' ? p.name_ar : p.name_en} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FallbackIcon flavor={p.flavor} />}
        {soldOut && <span className="soldout-badge">{t('products.soldOutBtn')}</span>}
      </div>
      <div className="product-info">
        <span className="flavor-tag">{t('products.granolaPrefix')}{lang === 'ar' ? p.name_ar : p.name_en}</span>
        <h3>{lang === 'ar' ? p.name_ar : p.name_en}</h3>
        <span className="en-name">{lang === 'ar' ? p.name_en : p.name_ar}</span>
        <p className="desc">{lang === 'ar' ? (p.description_ar ?? 'غرانولا فاخرة بجودة استثنائية.') : (p.description_en ?? 'Premium granola of exceptional quality.')}</p>
        {low && <span className="stock-low">{t('products.lowStock').replace('{n}', String(p.stock))}</span>}
        <div className="product-options">
          {p.price_250 != null && (
            <div className="size-selector">
              <button className={`size-btn ${weight === '250' ? 'active' : ''}`} onClick={() => selectWeight('250')}>{t('products.size250')}</button>
              {p.price_500 != null && <button className={`size-btn ${weight === '500' ? 'active' : ''}`} onClick={() => selectWeight('500')}>{t('products.size500')}</button>}
            </div>
          )}
          <span className="product-price-tag">{fmt(price)}</span>
          <button className={`product-btn ${added ? 'added' : ''} ${soldOut ? 'soldout' : ''}`} onClick={handleAdd}>{soldOut ? t('products.soldOutBtn') : added ? '✓ ' + t('products.added') : t('products.add')}</button>
        </div>
      </div>
    </div>
  )
}

function DailyCard({ p }: { p: Product }) {
  return <BuildBox daily={p} />
}

export default function Products() {
  const { t } = useL()
  const [filter, setFilter] = useState('all')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts().then(p => { setProducts(p); setLoading(false) })
  }, [])

  const granola = products.filter(p => !isGranola(p))
  const daily = products.filter(isGranola)
  const hasDaily = daily.length > 0
  const hasGranola = granola.length > 0

  useEffect(() => {
    if (loading || !hasDaily || window.location.hash !== '#daily') return
    const scrollTimer = setTimeout(() => {
      document.getElementById('daily')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }, 300)
    return () => clearTimeout(scrollTimer)
  }, [loading, hasDaily])

  return (
    <>
      <section className="products-hero">
        <div className="container">
          <h1>{t('products.pageTitle')}</h1>
          <p>{t('products.pageSub')}</p>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          <div className="filter-tabs">
            <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('products.all')}</button>
            {hasGranola && <button className={`filter-tab ${filter === 'granola' ? 'active' : ''}`} onClick={() => setFilter('granola')}>{t('products.granola')}</button>}
            {hasDaily && <button className={`filter-tab ${filter === 'daily' ? 'active' : ''}`} onClick={() => setFilter('daily')}>{t('products.daily')}</button>}
          </div>

          {loading && <div className="admin-empty">{t('products.loading')}</div>}

          {!loading && products.length === 0 && <div className="admin-empty">{t('products.empty')}</div>}

          {!loading && (filter === 'all' || filter === 'granola') && hasGranola && granola.map(p => (
            <ProductCard key={p.id} p={p} />
          ))}

          {!loading && (filter === 'all' || filter === 'daily') && hasDaily && (
            <div id="daily" className="products-daily-block">
              {daily.map(p => <DailyCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </section>

      <section className="quote-section">
        <div className="container"><blockquote>الطبيعة تملك كل ما تحتاجه. نحن فقط نضيف القليل من الحرفية.</blockquote></div>
      </section>
    </>
  )
}