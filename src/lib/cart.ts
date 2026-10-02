export interface CartItem {
  key: string
  productId: string
  name_ar: string
  name_en: string
  flavor: string
  weight: string
  price: number
  qty: number
  note?: string
}

const KEY = 'granoli_cart'

function getListeners(): (() => void)[] {
  try { return (window as any).__cartListeners || [] } catch { return [] }
}

function notify() {
  getListeners().forEach(fn => fn())
}

export function onCartChange(fn: () => void) {
  const listeners = getListeners()
  listeners.push(fn)
  ;(window as any).__cartListeners = listeners
}

function read(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  notify()
}

export function getCart() { return read() }

export function getCartCount() {
  return read().reduce((s, i) => s + i.qty, 0)
}

export function getCartTotal() {
  return read().reduce((s, i) => s + i.price * i.qty, 0)
}

function keyOf(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

export function addToCart(product: { id: string; name_ar: string; name_en: string; flavor: string; price_250?: number | null; price_500?: number | null; price_daily?: number | null }, weight: string, price: number, note?: string) {
  const items = read()
  const base = `${product.id}_${weight}`
  const key = note ? `${base}_${keyOf(note)}` : base
  const existing = items.find(i => i.key === key)
  if (existing) { existing.qty++ }
  else { items.push({ key, productId: product.id, name_ar: product.name_ar, name_en: product.name_en, flavor: product.flavor, weight, price, qty: 1, note }) }
  save(items)
}

export function updateQty(key: string, qty: number) {
  const items = read()
  const item = items.find(i => i.key === key)
  if (item) { item.qty = Math.max(1, qty); save(items) }
}

export function removeFromCart(key: string) {
  save(read().filter(i => i.key !== key))
}

export function clearCart() {
  localStorage.removeItem(KEY)
  notify()
}

/* ── كوبونات الخصم ── */
import { supabase } from './supabase'

export interface Coupon { code: string; percent: number }

export async function applyCoupon(code: string): Promise<Coupon | null> {
  try {
    const cleaned = code.trim().toUpperCase()
    if (!cleaned) return null
    const { data, error } = await supabase.from('coupons').select('code,percent,valid_from,valid_to,active').eq('code', cleaned).single()
    if (error || !data) return null
    const now = Date.now()
    const from = data.valid_from ? new Date(data.valid_from).getTime() : null
    const to = data.valid_to ? new Date(data.valid_to).getTime() : null
    if (data.active === false) return null
    if (from && now < from) return null
    if (to && now > to) return null
    const percent = Math.max(0, Math.min(100, Number(data.percent) || 0))
    if (percent <= 0) return null
    return { code: cleaned, percent }
  } catch { return null }
}

export function getCoupon(): Coupon | null {
  try { return JSON.parse(localStorage.getItem('granoli_coupon') || 'null') } catch { return null }
}

export function setCoupon(c: Coupon | null) {
  if (c) localStorage.setItem('granoli_coupon', JSON.stringify(c))
  else localStorage.removeItem('granoli_coupon')
}

export function couponDiscount(total: number): number {
  const c = getCoupon()
  return c ? (total * c.percent) / 100 : 0
}