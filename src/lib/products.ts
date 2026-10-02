import { supabase, supabaseUrl } from './supabase'

export interface Product {
  id: string
  name_ar: string
  name_en: string
  description_ar: string | null
  description_en: string | null
  flavor: string
  price_250: number | null
  price_500: number | null
  price_daily: number | null
  category: string | null
  image_url: string | null
  stock: number | null
}

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1', name_ar: 'ظƒظ„ط§ط³ظٹظƒ', name_en: 'Classic', flavor: 'classic',
    description_ar: 'ظ‚ظ…ط­ ظƒط§ظ…ظ„ ظ…ظ‚ط±ظ…ط´ ظ…ط¹ ظ…ظƒط³ط±ط§طھ ظˆط¨ط°ظˆط± ظ…ط®طھط§ط±ط© â€” ط§ظ„ط·ط¹ظ… ط§ظ„ط£طµظٹظ„ ط¨ظ„ط§ ط¥ط¶ط§ظپط§طھ. ظ…ط²ظٹط¬ ظ…ط«ط§ظ„ظٹ ظ…ظ† ط§ظ„ط´ظˆظپط§ظ† ظˆط§ظ„ظ„ظˆط² ظˆط§ظ„ط¨ط°ظˆط± ظٹظ…ظ†ط­ظƒ ط·ط§ظ‚ط© ط·ط¨ظٹط¹ظٹط© طھط¯ظˆظ… ط·ظˆظ„ ط§ظ„ظٹظˆظ….',
    description_en: 'Whole crispy oats with selected nuts and seeds',
    price_250: 4, price_500: 6, price_daily: null, category: 'granola', image_url: null, stock: 50,
  },
  {
    id: '2', name_ar: 'ط£ظˆط±طھط´ط§ط±ط¯', name_en: 'Orchard', flavor: 'orchard',
    description_ar: 'ظ…ط²ظٹط¬ ظپظˆط§ظƒظ‡ ط·ط§ط²ط¬ط© ط¨ظ†ظƒظ‡ط© ط­ظ„ظˆط© ط·ط¨ظٹط¹ظٹط© â€” ظ†ط¶ط§ط±ط© ط§ظ„ط­ط¯ظٹظ‚ط© ظپظٹ ظƒظ„ ظ‚ط¶ظ…ط©. طھظپط§ط­ ظ…ط¬ظپظپ ظˆظ…ط´ظ…ط´ ظˆط²ط¨ظٹط¨ ظ…ط¹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط´ظˆظپط§ظ† ط§ظ„ظ…ظ‚ط±ظ…ط´.',
    description_en: 'Fresh fruit blend with natural sweetness',
    price_250: 4, price_500: 6, price_daily: null, category: 'granola', image_url: null, stock: 50,
  },
  {
    id: '3', name_ar: 'ظˆظٹظ„ط¯ ط¨ظ„ظˆظ…', name_en: 'Wild Bloom', flavor: 'bloom',
    description_ar: 'ظ†ظƒظ‡ط© طھظˆطھ ط؛ظ†ظٹط© ط¨ط¹ظ…ظ‚ ط§ظ„ظپظˆط§ظƒظ‡ ط§ظ„ط¨ط±ظٹط© â€” ظ„ظ…ط³ط© ظ…ظ† ط§ظ„ط·ط¨ظٹط¹ط© ط§ظ„ط¨ط±ظٹط©. طھظˆطھ ط£ط²ط±ظ‚ ظˆظپط±ط§ظˆظ„ط© ظ…ط¬ظپظپط© ظˆظ‚ظ„ظٹظ„ ظ…ظ† ط§ظ„ظ„ط§ظپظ†ط¯ط± ظ…ط¹ ط§ظ„ط´ظˆظپط§ظ†.',
    description_en: 'Rich berry flavor with wild fruit depth',
    price_250: 4, price_500: 6, price_daily: null, category: 'granola', image_url: null, stock: 50,
  },
  {
    id: '4', name_ar: 'ط؛ظˆظ„ط¯ظ† ط¨ظگظٹظƒط§ظ†', name_en: 'Golden Pecan', flavor: 'pecan',
    description_ar: 'ظ‚ظ…ط­ ظ…ظ‚ط±ظ…ط´ ظ…ط¹ ط¹ط³ظ„ ط·ط¨ظٹط¹ظٹ ظˆط¨ظگظٹظƒط§ظ† ظ…ط­ظ…طµ â€” ط¯ظپط، ط§ظ„ط·ط¹ظ… ط§ظ„ط°ظ‡ط¨ظٹ. ط¨ظگظٹظƒط§ظ† ظ…ط­ظ…طµ ط¨ط¹ظ†ط§ظٹط© ظ…ط¹ ط¹ط³ظ„ ط·ط¨ظٹط¹ظٹ ط£طµظٹظ„.',
    description_en: 'Crispy oats with natural honey and roasted pecans',
    price_250: 4, price_500: 6, price_daily: null, category: 'granola', image_url: null, stock: 50,
  },
  {
    id: '5', name_ar: 'ط؛ط±ط§ظ†ظˆظ„ط§ ظٹظˆظ…ظٹط©', name_en: 'Daily Granola', flavor: 'daily',
    description_ar: '12 ط¬ط±ط¹ط© ظپط±ط¯ظٹط© ط¨ط­ط¬ظ… 40 ط¬ط±ط§ظ…طŒ ظ…ط«ط§ظ„ظٹط© ظ„ظ„ط¥ظپط·ط§ط± ط§ظ„ظٹظˆظ…ظٹ ط£ظˆ ط§ظ„ط­ظ‚ظٹط¨ط©. ظƒظ„ ط¬ط±ط¹ط© ظ…ظ†ظپطµظ„ط© ظˆظ…ط؛ظ„ظپط© ظ„ظ„ط­ظپط§ط¸ ط¹ظ„ظ‰ ط§ظ„ظ†ط¹ظˆظ…ط© ظˆط§ظ„ط·ط¹ظ….',
    description_en: '12 individual 40g portions for daily breakfast',
    price_250: null, price_500: null, price_daily: 5, category: 'daily', image_url: null, stock: 50,
  },
]

export const isGranola = (p: Product) => (p.category ?? '').toLowerCase() === 'daily' || p.price_daily != null

export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true })
    if (error) throw error
    const rows = data as Product[]
    if (!rows || rows.length === 0) return DEFAULT_PRODUCTS
    return rows.map(r => ({ ...r, price_250: r.price_250 ?? null, price_500: r.price_500 ?? null, price_daily: r.price_daily ?? null, stock: r.stock ?? null }))
  } catch {
    return DEFAULT_PRODUCTS
  }
}

export async function fetchCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('products').select('category')
    if (error) throw error
    const set = new Set((data ?? []).map((r: any) => r.category).filter(Boolean))
    return Array.from(set as Set<string>)
  } catch { return [] }
}

export const productImageUrl = (path: string) =>
  `${supabaseUrl}/storage/v1/object/public/product-images/${path}`

export const avatarImageUrl = (uid: string, path: string) =>
  `${supabaseUrl}/storage/v1/object/public/avatars/${uid}/${path}`
