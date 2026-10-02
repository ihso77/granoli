import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchProducts, fetchCategories, productImageUrl, DEFAULT_PRODUCTS, type Product } from '../lib/products'
import type { User } from '@supabase/supabase-js'

interface Order { id: string; shipping_name: string; shipping_phone: string; shipping_city: string; shipping_address: string; total: number; status: string; payment_method: string; items: any[]; created_at: string }

function toast(msg: string) {
  let t = document.querySelector('.toast') as HTMLDivElement
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t) }
  t.textContent = msg; t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2000)
}

type ConfirmTarget = { kind: 'product' | 'category'; id: string; label: string } | null

/* ── Product form ── */
function ProductForm({ product, categories, onDone }: { product: Product | null; categories: string[]; onDone: () => void }) {
  const [nameAr, setNameAr] = useState(product?.name_ar ?? '')
  const [nameEn, setNameEn] = useState(product?.name_en ?? '')
  const [flavor, setFlavor] = useState(product?.flavor ?? '')
  const [category, setCategory] = useState(product?.category ?? 'granola')
  const [price250, setPrice250] = useState(product?.price_250 != null ? String(product.price_250) : '')
  const [price500, setPrice500] = useState(product?.price_500 != null ? String(product.price_500) : '')
  const [priceDaily, setPriceDaily] = useState(product?.price_daily != null ? String(product.price_daily) : '')
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : '')
  const [descAr, setDescAr] = useState(product?.description_ar ?? '')
  const [descEn, setDescEn] = useState(product?.description_en ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(product?.image_url ?? null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = (f: File | null) => {
    setFile(f)
    if (f) setPreview(URL.createObjectURL(f))
  }

  const save = async () => {
    if (!nameAr.trim() || !nameEn.trim()) { toast('حط الاسم عربي وإنجليزي على الأقل'); return }
    setSaving(true)
    try {
      let image_url = product?.image_url ?? null
      if (file) {
        const ext = file.name.split('.').pop() || 'png'
        const path = `${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
        if (upErr) throw new Error(upErr.message)
        image_url = productImageUrl(path)
      }
      const baseRow: Record<string, unknown> = {
        name_ar: nameAr.trim(),
        name_en: nameEn.trim(),
        flavor: flavor.trim() || nameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: category.trim() || 'granola',
        price_250: price250 ? Number(price250) : null,
        price_500: price500 ? Number(price500) : null,
        price_daily: priceDaily ? Number(priceDaily) : null,
        stock: stock !== '' ? Number(stock) : null,
        description_ar: descAr.trim() || null,
        description_en: descEn.trim() || null,
        image_url,
      }
      const row = product ? { ...baseRow, id: product.id } : baseRow
      const { error } = await supabase.from('products').upsert(row as any)
      if (error) throw new Error(error.message)
      toast(product ? 'تم تحديث المنتج' : 'تمت إضافة المنتج')
      onDone()
    } catch (err: any) {
      toast('خطأ: ' + (err?.message || 'تعذر الحفظ'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-form">
      <div className="admin-form-head">
        <h3>{product ? 'تعديل منتج' : 'إضافة منتج'}</h3>
        <span className="en-note">{product ? product.name_en : 'منتج جديد'}</span>
      </div>

      <div className="form-row two">
        <div className="form-group"><label>الاسم بالعربية *</label><input value={nameAr} onChange={e => setNameAr(e.target.value)} className="form-input" /></div>
        <div className="form-group"><label>الاسم بالإنجليزية *</label><input value={nameEn} onChange={e => setNameEn(e.target.value)} className="form-input" /></div>
      </div>

      <div className="form-row two">
        <div className="form-group">
          <label>الفئة</label>
          <input list="admin-cat-list" value={category} onChange={e => setCategory(e.target.value)} className="form-input" placeholder="غرانولا / يومية / ..." />
          <datalist id="admin-cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="form-group"><label>المعرّف (slug)</label><input value={flavor} onChange={e => setFlavor(e.target.value)} className="form-input" placeholder="يُولّد تلقائيًا" /></div>
      </div>

      <div className="form-row three">
        <div className="form-group"><label>سعر 250 جرام (ر.ع)</label><input type="number" step="0.1" min="0" value={price250} onChange={e => setPrice250(e.target.value)} className="form-input" /></div>
        <div className="form-group"><label>سعر 500 جرام (ر.ع)</label><input type="number" step="0.1" min="0" value={price500} onChange={e => setPrice500(e.target.value)} className="form-input" /></div>
        <div className="form-group"><label>سعر العبوة اليومية (ر.ع)</label><input type="number" step="0.1" min="0" value={priceDaily} onChange={e => setPriceDaily(e.target.value)} className="form-input" /></div>
      </div>

      <div className="form-group">
        <label>الكمية المتوفرة (المخزون)</label>
        <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="form-input" placeholder="اتركه فارغ لكمية غير محدودة" />
      </div>

      <div className="form-row two">
        <div className="form-group"><label>الوصف بالعربية</label><textarea value={descAr} onChange={e => setDescAr(e.target.value)} className="form-input" rows={3} /></div>
        <div className="form-group"><label>الوصف بالإنجليزية</label><textarea value={descEn} onChange={e => setDescEn(e.target.value)} className="form-input" rows={3} /></div>
      </div>

      <div className="form-group">
        <label>صورة المنتج</label>
        <div className="upload-box" onClick={() => fileRef.current?.click()}>
          {preview ? <img src={preview} alt="" /> : <span>+ ارفع صورة المنتج</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pickFile(e.target.files?.[0] ?? null)} />
        {file && <button type="button" className="admin-btn" onClick={() => { setFile(null); setPreview(product?.image_url ?? null) }}>إزالة الصورة المحددة</button>}
      </div>

      <div className="admin-form-actions">
        <button className="admin-btn primary big" onClick={save} disabled={saving}>{saving ? 'جاري الحفظ...' : product ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
        <button className="admin-btn" onClick={onDone}>إلغاء</button>
      </div>
    </div>
  )
}

/* ── Main admin ── */
export default function Admin() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)
  const [view, setView] = useState<'dashboard' | 'orders' | 'products' | 'productForm' | 'categories' | 'coupons'>('dashboard')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [confirm, setConfirm] = useState<ConfirmTarget>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<any[]>([])
  const [couponForm, setCouponForm] = useState({ code: '', percent: '', from: '', to: '' })

  const loadRole = async (uid: string) => {
    try {
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', uid).single()
      setIsAdmin(!!data?.is_admin)
    } catch { setIsAdmin(false) }
    setCheckingRole(false)
  }

  const loadAll = async () => {
    const [p, c] = await Promise.all([fetchProducts(), fetchCategories()])
    setProducts(p)
    setCategories(c)
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data ?? [])
  }

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: true })
      if (error) throw new Error(error.message)
      const mapped = (data ?? []).map((o: any) => ({
        id: o.id,
        shipping_name: o.shipping_name ?? '',
        shipping_phone: o.shipping_phone ?? '',
        shipping_city: o.shipping_city ?? '',
        shipping_address: o.shipping_address ?? '',
        total: Number(o.total) || 0,
        status: o.status ?? 'pending',
        payment_method: o.payment_method ?? 'cod',
        created_at: o.created_at,
        items: (o.order_items ?? []).map((it: any) => ({ name_en: it.product_name, weight: it.weight, price: Number(it.price) || 0, qty: it.quantity, note: it.note }))
      }))
      setOrders(mapped as Order[])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) { loadRole(u.id); loadAll(); loadOrders() } else { setLoading(false); setCheckingRole(false) }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const u = s?.user ?? null; setUser(u)
      if (u) { loadRole(u.id); loadAll(); loadOrders() } else { setIsAdmin(false); setCheckingRole(false) }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const startAdd = () => { setEditing(null); setView('productForm') }
  const startEdit = (p: Product) => { setEditing(p); setView('productForm') }

  const doDeleteProduct = async () => {
    if (!confirm) return
    const { error } = await supabase.from('products').delete().eq('id', confirm.id)
    if (error) { toast('خطأ: ' + error.message) } else {
      toast('تم حذف المنتج')
      await loadAll()
    }
    setConfirm(null)
  }

  const renameCategory = async (oldSlug: string, newSlug: string) => {
    if (!newSlug.trim() || newSlug === oldSlug) return
    const { error } = await supabase.from('products').update({ category: newSlug.trim() }).eq('category', oldSlug)
    if (error) { toast('خطأ: ' + error.message) } else {
      toast('تم تحديث الفئة')
      await loadAll()
    }
  }

  const addCoupon = async () => {
    const { code, percent, from, to } = couponForm
    if (!code.trim() || !percent) { toast('حط الكود ونسبة الخصم'); return }
    const { error } = await supabase.from('coupons').insert({ code: code.trim().toUpperCase(), percent: Number(percent), valid_from: from || null, valid_to: to || null, active: true })
    if (error) { toast('خطأ: ' + error.message); return }
    toast('تمت إضافة الكوبون'); setCouponForm({ code: '', percent: '', from: '', to: '' }); await loadAll()
  }

  const deleteCoupon = async (id: string) => {
    await supabase.from('coupons').delete().eq('id', id); await loadAll()
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--umber-soft)' }}>جاري التحميل...</div>
  if (checkingRole) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--umber-soft)' }}>جاري التحقق...</div>

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo"><svg viewBox="0 0 80 80" fill="none"><ellipse cx="40" cy="40" rx="22" ry="34" transform="rotate(-12 40 40)" stroke="#D3A75C" strokeWidth="2.5" fill="rgba(211,167,92,.08)"/><line x1="40" y1="12" x2="40" y2="68" stroke="#D3A75C" strokeWidth="1.2" opacity=".35"/></svg></div>
          <h3 style={{ textAlign: 'center', fontFamily: "'El Messiri',serif", fontSize: 20, marginBottom: 24 }}>دخول الإدارة</h3>
          <form onSubmit={async e => { e.preventDefault(); const fd = new FormData(e.currentTarget); const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email') as string, password: fd.get('password') as string }); if (error) alert(error.message) }}>
            <div className="form-group"><label>البريد الإلكتروني</label><input type="email" name="email" className="form-input" required /></div>
            <div className="form-group"><label>كلمة المرور</label><input type="password" name="password" className="form-input" required /></div>
            <button type="submit" className="auth-submit">دخول</button>
            <Link to="/" className="auth-back">العودة للمتجر</Link>
          </form>
        </div>
      </div>
    )
  }

  if (user && !isAdmin) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo"><svg viewBox="0 0 80 80" fill="none"><ellipse cx="40" cy="40" rx="22" ry="34" transform="rotate(-12 40 40)" stroke="#D3A75C" strokeWidth="2.5" fill="rgba(211,167,92,.08)"/><line x1="40" y1="12" x2="40" y2="68" stroke="#D3A75C" strokeWidth="1.2" opacity=".35"/></svg></div>
          <h3 style={{ textAlign: 'center', fontFamily: "'El Messiri',serif", fontSize: 20, marginBottom: 12 }}>غير مصرح لك</h3>
          <p style={{ textAlign: 'center', color: 'var(--umber-soft)', fontSize: 14, marginBottom: 8 }}>هذه الصفحة مخصصة لمسؤولي المتجر فقط.</p>
          <button className="auth-submit" onClick={async () => { await supabase.auth.signOut(); setUser(null) }}>تسجيل الخروج</button>
          <Link to="/" className="auth-back">العودة للمتجر</Link>
        </div>
      </div>
    )
  }

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const filtered = search.trim() ? products.filter(p => (p.name_ar + p.name_en + (p.category ?? '')).includes(search.trim())) : products
  const catCount = (slug: string) => products.filter(p => p.category === slug).length

  const NAV = [
    { key: 'dashboard' as const, label: 'لوحة التحكم', icon: '◈' },
    { key: 'products' as const, label: 'المنتجات', icon: '☷' },
    { key: 'categories' as const, label: 'الكاتجوريات', icon: '▦' },
    { key: 'coupons' as const, label: 'الكوبونات', icon: '🏷' },
    { key: 'orders' as const, label: 'الطلبات', icon: '☰' },
  ]

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sb-brand">
          <span className="admin-sb-logo">G</span>
          <div>
            <div className="admin-sb-title">GRANOLI</div>
            <div className="admin-sb-sub">لوحة التحكم</div>
          </div>
        </div>
        <nav className="admin-sb-nav">
          {NAV.map(n => (
            <button key={n.key} className={`admin-sb-item ${view === n.key ? 'active' : ''}`} onClick={() => setView(n.key)}>
              <span className="admin-sb-ico">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="admin-sb-footer">
          <Link to="/" className="admin-sb-item"><span className="admin-sb-ico">⇠</span>عرض الموقع</Link>
          <button className="admin-sb-item" onClick={async () => { await supabase.auth.signOut(); setUser(null) }}><span className="admin-sb-ico">⎋</span>تسجيل الخروج</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h2>{view === 'dashboard' ? 'لوحة التحكم' : view === 'orders' ? 'الطلبات' : view === 'products' ? 'المنتجات' : view === 'categories' ? 'الكاتجوريات' : view === 'coupons' ? 'الكوبونات' : 'إضافة / تعديل منتج'}</h2>
          {view === 'products' && <button className="admin-btn primary big" onClick={startAdd}>+ إضافة منتج</button>}
          {view === 'productForm' && <button className="admin-btn" onClick={() => setView('products')}>← رجوع للمنتجات</button>}
        </div>

        <div className="admin-content">
          {view === 'dashboard' && (
            <>
              <div className="admin-stats">
                <div className="stat-card"><div className="stat-label">إجمالي الطلبات</div><div className="stat-value">{orders.length}</div></div>
                <div className="stat-card"><div className="stat-label">الطلبات المعلقة</div><div className="stat-value">{pendingOrders}</div></div>
                <div className="stat-card"><div className="stat-label">إجمالي الإيرادات</div><div className="stat-value">{totalRevenue.toFixed(2)} ر.ع</div></div>
                <div className="stat-card"><div className="stat-label">المنتجات</div><div className="stat-value">{products.length}</div></div>
              </div>
              <h3 style={{ fontFamily: "'El Messiri',serif", fontSize: 20, marginBottom: 16 }}>آخر الطلبات</h3>
              {orders.length === 0 ? <div className="admin-empty">لا توجد طلبات بعد</div> : (
                <table className="admin-table">
                  <thead><tr><th>رقم الطلب</th><th>العميل</th><th>المدينة</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead>
                  <tbody>
                    {orders.slice(-5).reverse().map(o => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 600 }}>{o.id}</td>
                        <td>{o.shipping_name}</td>
                        <td>{o.shipping_city}</td>
                        <td style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>{o.total.toFixed(2)} ر.ع</td>
                        <td><span className={`status-badge status-${o.status === 'pending' ? 'pending' : o.status === 'processing' ? 'processing' : 'delivered'}`}>{o.status === 'pending' ? 'معلق' : o.status === 'processing' ? 'قيد التجهيز' : 'تم التوصيل'}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--umber-soft)' }}>{new Date(o.created_at).toLocaleDateString('ar-OM')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {view === 'orders' && (
            <>
              <h3 style={{ fontFamily: "'El Messiri',serif", fontSize: 22, marginBottom: 24 }}>جميع الطلبات</h3>
              {orders.length === 0 ? <div className="admin-empty">لا توجد طلبات</div> : (
                <table className="admin-table">
                  <thead><tr><th>رقم</th><th>العميل</th><th>الجوال</th><th>المدينة</th><th>المبلغ</th><th>الدفع</th><th>الحالة</th><th></th></tr></thead>
                  <tbody>
                    {orders.slice().reverse().map(o => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 600, fontSize: 12 }}>{o.id}</td>
                        <td>{o.shipping_name}</td>
                        <td dir="ltr" style={{ textAlign: 'right' }}>{o.shipping_phone}</td>
                        <td>{o.shipping_city}</td>
                        <td style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>{o.total.toFixed(2)} ر.ع</td>
                        <td>{o.payment_method === 'cod' ? 'عند الاستلام' : 'بطاقة'}</td>
                        <td><span className={`status-badge status-${o.status === 'pending' ? 'pending' : o.status === 'processing' ? 'processing' : 'delivered'}`}>{o.status === 'pending' ? 'معلق' : o.status === 'processing' ? 'قيد التجهيز' : 'تم التوصيل'}</span></td>
                        <td>
                          {o.status === 'pending' && <button className="admin-btn primary" onClick={() => updateStatus(o.id, 'processing')}>تأكيد</button>}
                          {o.status === 'processing' && <button className="admin-btn" onClick={() => updateStatus(o.id, 'delivered')}>تم التوصيل</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {view === 'products' && (
            <>
              <div className="admin-toolbar">
                <input className="form-input" placeholder="ابحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {filtered.length === 0 ? (
                <div className="admin-empty">
                  {products.length === 0 ? 'لا توجد منتجات بعد — أضف أول منتج' : 'لا توجد نتائج'}
                  {products.length === 0 && <div><button className="admin-btn primary big" style={{ marginTop: 16 }} onClick={startAdd}>+ إضافة منتج</button></div>}
                </div>
              ) : (
                <div className="admin-prod-grid">
                  {filtered.map(p => (
                    <div className="admin-prod-card" key={p.id}>
                      <div className="admin-prod-img">
                        {p.image_url ? <img src={p.image_url} alt={p.name_ar} /> : <span>{p.name_ar[0]}</span>}
                      </div>
                      <div className="admin-prod-body">
                        <div className="admin-prod-title">{p.name_ar}</div>
                        <div className="admin-prod-en">{p.name_en}</div>
                        <div className="admin-prod-meta">
                          <span className="admin-prod-cat">{p.category}</span>
                          <span className="admin-prod-price">{p.price_250 != null && `${p.price_250} ر.ع / ${p.price_500 != null ? '500ج ' + p.price_500 + ' ر.ع' : '250ج'}`}{p.price_daily != null && ` | ${p.price_daily} ر.ع يومية`}</span>
                          <span className={`admin-prod-stock ${p.stock != null && p.stock <= 0 ? 'soldout' : ''}`}>{p.stock == null ? 'كمية غير محدودة' : p.stock <= 0 ? 'Sold Out' : `المتبقي: ${p.stock}`}</span>
                        </div>
                      </div>
                      <div className="admin-prod-actions">
                        <button className="admin-btn primary" onClick={() => startEdit(p)}>تعديل</button>
                        <button className="admin-btn danger" onClick={() => setConfirm({ kind: 'product', id: p.id, label: p.name_ar })}>حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {view === 'productForm' && (
            <ProductForm key={editing?.id ?? 'new'} product={editing} categories={categories} onDone={() => { loadAll(); setView('products') }} />
          )}

          {view === 'categories' && (
            <CategoryManager products={products} categories={categories} onChanged={loadAll} onDelete={setConfirm} />
          )}

          {view === 'coupons' && (
            <div className="coupons-panel">
              <div className="form-row three">
                <div className="form-group"><label>كود الخصم</label><input className="form-input" value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value }))} placeholder="مثال: RAMADAN30" /></div>
                <div className="form-group"><label>نسبة الخصم (%)</label><input type="number" min="1" max="100" className="form-input" value={couponForm.percent} onChange={e => setCouponForm(f => ({ ...f, percent: e.target.value }))} /></div>
                <div className="form-group"><label>انتهاء الصلاحية (اختياري)</label><input type="date" className="form-input" value={couponForm.to} onChange={e => setCouponForm(f => ({ ...f, to: e.target.value }))} /></div>
              </div>
              <button className="admin-btn primary big" onClick={addCoupon}>+ إضافة كوبون</button>
              <div className="coupons-list">
                {coupons.length === 0 && <div className="admin-empty">لا توجد كوبونات بعد</div>}
                {coupons.map(c => (
                  <div key={c.id} className="coupon-row">
                    <span className="coupon-code">{c.code}</span>
                    <span className="coupon-pct">{c.percent}%</span>
                    <span className="coupon-dates">{c.valid_from ?? '—'} → {c.valid_to ?? '∞'}</span>
                    <button className="admin-btn danger" onClick={() => deleteCoupon(c.id)}>حذف</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {confirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>{confirm.kind === 'product' ? 'حذف المنتج' : 'حذف الفئة'}</h4>
            <p>متأكد تبي تحذف <strong>«{confirm.label}»</strong>؟</p>
            <div className="modal-actions">
              <button className="admin-btn danger big" onClick={doDeleteProduct}>نعم، احذف</button>
              <button className="admin-btn" onClick={() => setConfirm(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryManager({ products, categories, onChanged, onDelete }: {
  products: Product[]; categories: string[]; onChanged: () => void; onDelete: (t: { kind: 'category'; id: string; label: string }) => void
}) {
  const [newCat, setNewCat] = useState('')
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editingVal, setEditingVal] = useState('')

  const addCategory = async () => {
    if (!newCat.trim()) return
    if (categories.includes(newCat.trim())) { toast('الفئة موجودة'); return }
    const { error } = await supabase.from('products').insert({ name_ar: 'فئة مؤقتة', name_en: 'temp', flavor: 'temp-' + Date.now(), category: newCat.trim(), price_250: null, price_500: null, price_daily: null })
    if (error) { toast('خطأ: ' + error.message) } else { toast('تمت إضافة الفئة'); setNewCat(''); onChanged() }
  }

  const commitRename = async (slug: string) => {
    const { error } = await supabase.from('products').update({ category: editingVal.trim() }).eq('category', slug)
    if (error) { toast('خطأ: ' + error.message) } else { toast('تم تحديث الفئة'); onChanged() }
    setEditingSlug(null)
  }

  return (
    <>
      <div className="cat-add">
        <input className="form-input" placeholder="فئة جديدة (مثال: حبوب الإفطار)..." value={newCat} onChange={e => setNewCat(e.target.value)} />
        <button className="admin-btn primary big" onClick={addCategory}>+ إضافة فئة</button>
      </div>
      <div className="cat-list">
        {categories.length === 0 && <div className="admin-empty">لا توجد فئات</div>}
        {categories.map(c => {
          const count = products.filter(p => p.category === c).length
          return (
            <div className="cat-row" key={c}>
              {editingSlug === c ? (
                <>
                  <input className="form-input" value={editingVal} onChange={e => setEditingVal(e.target.value)} />
                  <button className="admin-btn primary" onClick={() => commitRename(c)}>حفظ</button>
                  <button className="admin-btn" onClick={() => setEditingSlug(null)}>إلغاء</button>
                </>
              ) : (
                <>
                  <div className="cat-name"><span className="cat-dot" /> {c} <span className="cat-count">{count} منتج</span></div>
                  <div className="cat-actions">
                    <button className="admin-btn" onClick={() => { setEditingSlug(c); setEditingVal(c) }}>إعادة تسمية</button>
                    <button className="admin-btn danger" disabled={count > 0} title={count > 0 ? 'لا يمكن حذف فئة عليها منتجات' : ''} onClick={() => onDelete({ kind: 'category', id: c, label: c })}>حذف</button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}