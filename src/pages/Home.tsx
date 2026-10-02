import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { addToCart } from '../lib/cart'
import { fetchProducts, isGranola, type Product } from '../lib/products'
import { ProductCard } from './Products'
import { useL } from '../lib/settings'

const KERNEL_PATH = 'M0,-8 C4,-8 6,-4 6,0 C6,4 4,8 0,8 C-4,8 -6,4 -6,0 C-6,-4 -4,-8 0,-8Z'
const CHUNK_PATH = 'M0,-6 C3,-7 6,-4 7,-1 C8,2 6,6 3,7 C0,8 -4,7 -6,4 C-8,1 -7,-3 -4,-5 Z'

function toast(msg: string) {
  let t = document.querySelector('.toast') as HTMLDivElement
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t) }
  t.textContent = msg; t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2000)
}

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target) } }), { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

function HeroStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return
      obs.disconnect()
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(value); return }
      const start = performance.now(); const dur = 1500
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur)
        setN(Math.round(value * (1 - Math.pow(1 - t, 3))))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])

  return (
    <div className="hero-stat" ref={ref}>
      <div className="hero-stat-value">{n}{suffix}</div>
      <div className="hero-stat-label">{label}</div>
    </div>
  )
}

export default function Home() {
  const { t, fmt, lang } = useL()
  const particlesRef = useRef<HTMLDivElement>(null)
  const granolaRef = useRef<HTMLDivElement>(null)
  const heroLogoRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<Product[]>([])
  const [faqOpen, setFaqOpen] = useState(0)
  useReveal()

  useEffect(() => {
    fetchProducts().then(p => setPreview(p.filter(x => !isGranola(x)))).catch(() => {})
  }, [])

  /* تساقط حبات الغرانولا في الهيرو */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const c = granolaRef.current
    if (!c) return
    const colors = ['rgba(232,199,126,.6)', 'rgba(211,167,92,.55)', 'rgba(169,124,58,.5)']
    for (let i = 0; i < 22; i++) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const size = 10 + Math.random() * 16
      svg.setAttribute('width', String(size)); svg.setAttribute('height', String(size))
      svg.setAttribute('viewBox', '-10 -10 20 20'); svg.classList.add('grain')
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', i % 2 ? KERNEL_PATH : CHUNK_PATH)
      p.setAttribute('fill', colors[i % colors.length])
      svg.appendChild(p)
      svg.style.left = (Math.random() * 96 + 2) + '%'
      svg.style.setProperty('--sway', (Math.random() * 70 - 35).toFixed(0) + 'px')
      svg.style.animation = `grain-fall ${8 + Math.random() * 10}s linear ${Math.random() * 10}s infinite`
      c.appendChild(svg)
    }
  }, [])

  /* حبيبات وحبات عسل ونجوم عائمة في الهيرو */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const container = particlesRef.current
    if (!container) return

    const colors = ['rgba(211,167,92,.4)', 'rgba(169,124,58,.35)', 'rgba(238,205,150,.5)', 'rgba(124,138,108,.35)']

    for (let i = 0; i < 16; i++) {
      const kind = i % 3
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const size = kind === 1 ? 6 + Math.random() * 8 : 9 + Math.random() * 20
      svg.setAttribute('width', String(size)); svg.setAttribute('height', String(size))
      svg.classList.add('particle')
      const p = document.createElementNS('http://www.w3.org/2000/svg', kind === 2 ? 'circle' : 'path')
      if (kind === 2) {
        p.setAttribute('cx', '0'); p.setAttribute('cy', '0'); p.setAttribute('r', '3')
      } else {
        p.setAttribute('d', kind === 1 ? 'M0,-6 L1.5,-1.5 L6,0 L1.5,1.5 L0,6 L-1.5,1.5 L-6,0 L-1.5,-1.5 Z' : KERNEL_PATH)
      }
      p.setAttribute('fill', colors[i % colors.length])
      svg.appendChild(p)
      svg.style.left = Math.random() * 100 + '%'; svg.style.top = '112%'
      svg.style.animation = `drift ${14 + Math.random() * 20}s linear ${Math.random() * 12}s infinite`
      container.appendChild(svg)
    }
  }, [])

  /* بارالاكس الشعار مع الماوس */
  useEffect(() => {
    const hero = document.getElementById('hero')!
    const logo = heroLogoRef.current!
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const handler = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - .5
      const y = (e.clientY - rect.top) / rect.height - .5
      logo.style.transform = `translate(${x * -18}px,${y * -14}px)`
    }
    hero.addEventListener('mousemove', handler)
    return () => hero.removeEventListener('mousemove', handler)
  }, [])

  /* هالة ذهبية تتبع الماوس — تمت إزالتها
  */

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const product = JSON.parse((e.currentTarget as HTMLElement).dataset.product!)
      addToCart(product, '250g', product.price_250 || product.price_daily)
      const btn = e.currentTarget as HTMLButtonElement
      const orig = btn.textContent!; btn.textContent = '✓ تمت الإضافة'; btn.classList.add('added')
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('added') }, 2000)
      toast('تمت الإضافة للسلة')
    } catch {}
  }

  return (
    <>
      {/* HERO */}
      <section className="hero" id="hero">
        <div className="particles" ref={particlesRef} />
        <div className="granola-fall" ref={granolaRef} />
        <div className="vignette" />

        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-logo" ref={heroLogoRef}>
              <img src="/images/granoli-logo.png" alt="شعار غرانولا GRANOLI" style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1>{lang === 'ar' ? <>غرانولا <span className="gold-text">فاخرة</span></> : <><span className="gold-text">Premium</span> Granola</>}</h1>
            <p>{t('hero.sub')}</p>
            <div className="hero-ctas">
              <Link to="/products" className="btn-gold shimmer">{t('hero.cta1')}</Link>
              <a href="#products" className="btn-ghost">{t('hero.cta2')}</a>
            </div>
            <div className="hero-stats">
              <HeroStat value={100} suffix={lang === 'ar' ? '٪' : '%'} label={t('hero.stat1')} />
              <HeroStat value={5} suffix="" label={t('hero.stat2')} />
              <HeroStat value={0} suffix={lang === 'ar' ? '٪' : '%'} label={t('hero.stat3')} />
            </div>
          </div>

          <div className="hero-bowl">
            <div className="hero-bowl-glow" />
            <div className="bowl-float">
              <img src="/images/granola-bowl.png" alt={lang === 'ar' ? 'وعاء غرانولا GRANOLI' : 'GRANOLI granola bowl'} />
            </div>
            <span className="chip chip-1"><span className="chip-ico">✿</span> {t('chip.natural')}</span>
            <span className="chip chip-2"><span className="chip-ico">✦</span> {t('chip.roast')}</span>
          </div>
        </div>

        <div className="scroll-hint"><span /></div>
      </section>

      {/* PRODUCTS */}
      <section className="browse-cta" id="products">
        <div className="container">
          <h2 className="section-title reveal title-underline">{t('prod.title')}</h2>
          <p className="tagline reveal" style={{ marginBottom: 40 }}>{t('prod.tagline')}</p>
          <div className="home-products-grid">
            {preview.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
          <div className="home-daily">
            <div className="home-daily-teaser reveal">
              <div className="home-daily-info">
                <span className="bb-kicker">{t('daily.kicker')}</span>
                <h3>{t('daily.title')}</h3>
                <p>{t('daily.sub')}{fmt(5)}</p>
              </div>
              <Link to="/products#daily" className="home-daily-btn">{t('daily.btn')}</Link>
            </div>
          </div>
          <Link to="/products" className="btn-gold shimmer reveal" style={{ fontSize: 15, padding: '13px 36px', marginTop: 40, display: 'inline-block' }}>{t('prod.viewAll')}</Link>
        </div>
      </section>

      {/* QUOTE */}
      <section className="quote-section">
        <div className="container">
          <span className="quote-mark reveal">“</span>
          <blockquote className="reveal">{t('quote.text')}</blockquote>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="container">
          <h2 className="section-title reveal title-underline">{t('faq.title')}</h2>
          <div className="faq-list">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className={`faq-item ${faqOpen === n ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setFaqOpen(faqOpen === n ? 0 : n)}>
                  <span>{t(`faq.q${n}`)}</span>
                  <span className="faq-ico">+</span>
                </button>
                <div className="faq-a"><p>{t(`faq.a${n}`)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-section" id="contact">
        <div className="container">
          <div className="contact-logo reveal">
            <svg viewBox="0 0 80 80" fill="none"><ellipse cx="40" cy="40" rx="22" ry="34" transform="rotate(-12 40 40)" stroke="#D3A75C" strokeWidth="2.5" fill="rgba(211,167,92,.08)"/><line x1="40" y1="12" x2="40" y2="68" stroke="#D3A75C" strokeWidth="1.2" opacity=".35"/></svg>
          </div>
          <p className="reveal">{t('contact.sub')}</p>
          <a href="mailto:info@granoli.om" className="btn-contact shimmer reveal">{t('contact.btn')}</a>
        </div>
      </section>
    </>
  )
}