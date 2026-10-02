import { createContext, useContext, useEffect, useState } from 'react'

export type Lang = 'ar' | 'en'
export type Currency = 'OMR' | 'SAR' | 'AED' | 'KWD' | 'QAR' | 'BHD'

export const RATES: Record<Currency, number> = { OMR: 1, SAR: 9.76, AED: 9.54, KWD: 0.79, QAR: 9.47, BHD: 0.98 }
const SYM_AR: Record<Currency, string> = { OMR: 'ر.ع', SAR: 'ر.س', AED: 'د.إ', KWD: 'د.ك', QAR: 'ر.ق', BHD: 'د.ب' }
const SYM_EN: Record<Currency, string> = { OMR: 'OMR', SAR: 'SAR', AED: 'AED', KWD: 'KWD', QAR: 'QAR', BHD: 'BHD' }
const COUNTRY_CURRENCY: Record<string, Currency> = { OM: 'OMR', SA: 'SAR', AE: 'AED', KW: 'KWD', QA: 'QAR', BH: 'BHD' }
export const CURRENCIES: Currency[] = ['OMR', 'SAR', 'AED', 'KWD', 'QAR', 'BHD']

const AR: Record<string, string> = {
  'nav.home': 'الرئيسية', 'nav.products': 'المنتجات', 'nav.contact': 'تواصل', 'nav.admin': 'لوحة الإدارة',
  'nav.login': 'دخول', 'nav.logout': 'تسجيل الخروج', 'nav.account': 'حسابي', 'nav.menu': 'القائمة',
  'nav.orders': 'طلباتي', 'nav.cartLabel': 'السلة', 'nav.settings': 'الإعدادات',
  'hero.title': 'غرانولا فاخرة', 'hero.sub': 'مصنوعة يدويًا من أجود المكونات الطبيعية، بلا سكر مضاف أو مواد حافظة',
  'hero.cta1': 'اكتشف النكهات', 'hero.cta2': 'شاهد منتجاتنا',
  'hero.stat1': 'مكونات طبيعية', 'hero.stat2': 'نكهات فاخرة', 'hero.stat3': 'سكر مضاف',
  'chip.natural': 'طبيعي ١٠٠٪', 'chip.roast': 'تحميص بطيء',
  'prod.title': 'منتجاتنا', 'prod.tagline': 'أربع نكهات فاخرة، صُنعت بعناية',
  'prod.viewAll': 'تصفح كل المنتجات',
  'daily.kicker': 'DAILY GRANOLA — BUILD YOUR BOX',
  'daily.title': 'الصندوق اليومي — اصنع صندوقك',
  'daily.sub': 'اختر نكهاتك بدفعات من 3 حصص حتى تكمل 12 حصة. 12 × 40 جرام · 480 جرام إجمالي · ',
  'daily.btn': 'اصنع صندوقك',
  'quote.text': 'الطبيعة تملك كل ما تحتاجه. نحن فقط نضيف القليل من الحرفية.',
  'faq.title': 'الأسئلة الشائعة',
  'faq.q1': 'هل التوصيل متاح خارج سلطنة عمان؟',
  'faq.a1': 'نعم، نوصّل إلى دول الخليج العربي فقط. الشحن داخل السلطنة مجاني، ولدول الخليج تُحسب رسوم الشحن حسب الدولة عند التأكيد.',
  'faq.q2': 'كم تستغرق مدة التوصيل؟',
  'faq.a2': 'داخل عُمان من 1 إلى 3 أيام عمل، ولدول الخليج من 3 إلى 7 أيام عمل.',
  'faq.q3': 'كيف يتم الدفع؟',
  'faq.a3': 'الدفع عند الاستلام (نقدًا أو بالبطاقة عند الاستلام) متاح داخل السلطنة وخارجها.',
  'faq.q4': 'كيف أحافظ على نضارة الغرانولا؟',
  'faq.a4': 'خزّن العبوة في مكان جاف وبارد بعيدًا عن الشمس، وأغلق الكيس جيدًا بعد كل استخدام. تناسب حتى 3 أشهر.',
  'faq.q5': 'هل يمكنني اختيار نكهات الصندوق اليومي؟',
  'faq.a5': 'نعم، الصندوق اليومي قابل للتخصيص — اختر نكهاتك بدفعات من 3 حصص حتى تكمل 12 حصة.',
  'contact.title': 'تواصل معنا', 'contact.sub': 'لأي استفسار أو طلب', 'contact.btn': 'تواصل معنا',
  'footer.tagline': 'صُنع يدويًا بعناية', 'footer.rights': 'غرانولا GRANOLI. جميع الحقوق محفوظة.',
  'settings.title': 'الإعدادات', 'settings.lang': 'اللغة', 'settings.currency': 'العملة',
  'settings.auto': 'تلقائي (حسب الدولة)',
  'products.pageTitle': 'منتجاتنا', 'products.pageSub': 'غرانولا فاخرة، نكهات مميزة تجمع بين الأصالة والجودة',
  'products.all': 'الكل', 'products.granola': 'غرانولا', 'products.daily': 'غرانولا يومية',
  'products.loading': 'جاري تحميل المنتجات...', 'products.empty': 'لا توجد منتجات بعد.',
  'products.size250': '250 جرام', 'products.size500': '500 جرام',
  'products.soldOutBtn': 'نفذت الكمية', 'products.soldOutToast': 'Sold Out — الكمية نافذة',
  'products.lowStock': 'متبقي {n} فقط', 'products.add': 'أضف للسلة', 'products.added': 'تمت الإضافة للسلة',
  'products.noPrice': 'السعر غير محدد', 'products.granolaPrefix': 'غرانولا ',
  'box.title': 'اصنع صندوقك الآن', 'box.sub': 'اختر نكهاتك بدفعات من 3 حصص، حتى تكمل الـ 12 حصة',
  'box.total': 'إجمالي', 'box.parts': '{n} حصة', 'box.selected': 'اخترت {n} من 12 حصة', 'box.ready': 'صندوقك جاهز! ✓',
  'box.addReady': 'أضف السلة — {p}', 'box.addMore': 'أكمل اختيار 12 حصة',
  'box.toastIncomplete': 'اختر 12 حصة كاملة', 'box.addedToast': 'تمت إضافة صندوقك للسلة',
  'cart.title': 'سلة التسوق', 'cart.empty': 'سلتك فارغة', 'cart.browse': 'تصفح المنتجات',
  'cart.productsCount': 'عناصر', 'cart.subtotal': 'المجموع الفرعي', 'cart.shipping': 'الشحن', 'cart.free': 'مجاني',
  'cart.total': 'الإجمالي', 'cart.checkout': 'إتمام الطلب', 'cart.remove': 'إزالة',
  'cart.couponPh': 'كود خصم', 'cart.couponApply': 'تطبيق', 'cart.couponApplied': 'كود الخصم مفعّل',
  'cart.couponInvalid': 'الكود غير صالح أو منتهي', 'cart.discount': 'الخصم',
  'checkout.title': 'إتمام الطلب', 'checkout.shipTitle': 'بيانات الشحن',
  'checkout.name': 'الاسم الكامل', 'checkout.namePh': 'الاسم على الطلب', 'checkout.phone': 'رقم الجوال',
  'checkout.phonePh': '9xxxxxxxx', 'checkout.city': 'المدينة', 'checkout.cityPh': 'اختر المدينة',
  'checkout.address': 'العنوان التفصيلي', 'checkout.addressPh': 'الحي، الشارع، رقم المبنى',
  'checkout.notes': 'ملاحظات إضافية (اختياري)', 'checkout.notesPh': 'أي ملاحظات للتوصيل',
  'checkout.total': 'المبلغ الإجمالي', 'checkout.pay': 'تأكيد الطلب — الدفع عند الاستلام',
  'checkout.paying': 'جاري تأكيد الطلب...', 'checkout.summary': 'ملخص الطلب', 'checkout.note': 'ملاحظة',
  'checkout.error': 'حدث خطأ، حاول مرة أخرى',
  'success.title': 'تم تأكيد طلبك!', 'success.sub': 'شكرًا لك. سنقوم بتجهيز طلبك وتوصيله قريبًا.',
  'success.back': 'العودة للمتجر',
}

const EN: Record<string, string> = {
  'nav.home': 'Home', 'nav.products': 'Products', 'nav.contact': 'Contact', 'nav.admin': 'Admin Panel',
  'nav.login': 'Login', 'nav.logout': 'Log out', 'nav.account': 'My account', 'nav.menu': 'Menu',
  'nav.orders': 'My orders', 'nav.cartLabel': 'Cart', 'nav.settings': 'Settings',
  'hero.title': 'Premium Granola', 'hero.sub': 'Handcrafted from the finest natural ingredients — no added sugar, no preservatives',
  'hero.cta1': 'Discover Flavors', 'hero.cta2': 'See our Products',
  'hero.stat1': 'Natural ingredients', 'hero.stat2': 'Premium flavors', 'hero.stat3': 'Added sugar',
  'chip.natural': '100% Natural', 'chip.roast': 'Slow roasted',
  'prod.title': 'Our Products', 'prod.tagline': 'Four premium flavors, crafted with care',
  'prod.viewAll': 'View all products',
  'daily.kicker': 'DAILY GRANOLA — BUILD YOUR BOX',
  'daily.title': 'Daily Box — Build Your Box',
  'daily.sub': 'Pick your flavors in multiples of 3 to fill 12 portions. 12 × 40g · 480g total · ',
  'daily.btn': 'Build Your Box',
  'quote.text': 'Nature has everything you need. We just add a little craftsmanship.',
  'faq.title': 'Frequently Asked Questions',
  'faq.q1': 'Do you deliver outside Oman?',
  'faq.a1': 'Yes, we deliver to the GCC countries only. Shipping is free inside Oman, and a delivery fee applies for other GCC countries at checkout.',
  'faq.q2': 'How long does delivery take?',
  'faq.a2': 'Within Oman 1–3 working days; for GCC countries 3–7 working days.',
  'faq.q3': 'How do I pay?',
  'faq.a3': 'Cash on delivery is available both inside and outside the Sultanate.',
  'faq.q4': 'How do I keep my granola fresh?',
  'faq.a4': 'Store the pack in a cool, dry place away from sunlight and seal it well after each use. It stays fresh for up to 3 months.',
  'faq.q5': 'Can I choose my Daily Box flavors?',
  'faq.a5': 'Yes! The Daily Box is customizable — pick each flavor in multiples of 3 to fill 12 portions.',
  'contact.title': 'Contact', 'contact.sub': 'For any inquiry or request', 'contact.btn': 'Contact us',
  'footer.tagline': 'Handcrafted with care', 'footer.rights': 'Granola GRANOLI. All rights reserved.',
  'settings.title': 'Settings', 'settings.lang': 'Language', 'settings.currency': 'Currency',
  'settings.auto': 'Auto (by country)',
  'products.pageTitle': 'Our Products', 'products.pageSub': 'Premium granola with distinctive flavors combining authenticity and quality',
  'products.all': 'All', 'products.granola': 'Granola', 'products.daily': 'Daily Granola',
  'products.loading': 'Loading products...', 'products.empty': 'No products yet.',
  'products.size250': '250g', 'products.size500': '500g',
  'products.soldOutBtn': 'Sold out', 'products.soldOutToast': 'Sold Out — this item is out of stock',
  'products.lowStock': 'Only {n} left', 'products.add': 'Add to cart', 'products.added': 'Added to cart',
  'products.noPrice': 'Price not set', 'products.granolaPrefix': 'Granola ',
  'box.title': 'Build Your Box', 'box.sub': 'Pick flavors in multiples of 3 until you fill all 12 portions',
  'box.total': 'Total', 'box.parts': '{n} portions', 'box.selected': 'Selected {n} of 12', 'box.ready': 'Your box is ready! ✓',
  'box.addReady': 'Add to cart — {p}', 'box.addMore': 'Pick all 12 portions to continue',
  'box.toastIncomplete': 'Pick 12 full portions', 'box.addedToast': 'Your box was added to the cart',
  'cart.title': 'Shopping Cart', 'cart.empty': 'Your cart is empty', 'cart.browse': 'Browse products',
  'cart.productsCount': 'items', 'cart.subtotal': 'Subtotal', 'cart.shipping': 'Shipping', 'cart.free': 'Free',
  'cart.total': 'Total', 'cart.checkout': 'Checkout', 'cart.remove': 'Remove',
  'cart.couponPh': 'Coupon code', 'cart.couponApply': 'Apply', 'cart.couponApplied': 'Coupon applied',
  'cart.couponInvalid': 'Invalid or expired code', 'cart.discount': 'Discount',
  'checkout.title': 'Checkout', 'checkout.shipTitle': 'Shipping Details',
  'checkout.name': 'Full name', 'checkout.namePh': 'Name on order', 'checkout.phone': 'Phone number',
  'checkout.phonePh': '9xxxxxxxx', 'checkout.city': 'City', 'checkout.cityPh': 'Select city',
  'checkout.address': 'Full address', 'checkout.addressPh': 'Area, street, building no.',
  'checkout.notes': 'Additional notes (optional)', 'checkout.notesPh': 'Any delivery notes',
  'checkout.total': 'Total amount', 'checkout.pay': 'Confirm order — Cash on Delivery',
  'checkout.paying': 'Confirming order...', 'checkout.summary': 'Order Summary', 'checkout.note': 'Note',
  'checkout.error': 'Something went wrong, try again',
  'success.title': 'Order Confirmed!', 'success.sub': 'Thank you. We will prepare your order and deliver soon.',
  'success.back': 'Back to store',
}

const TX: Record<Lang, Record<string, string>> = { ar: AR, en: EN }

const CITY_LIST = [
  { ar: 'مسقط', en: 'Muscat' }, { ar: 'صلالة', en: 'Salalah' }, { ar: 'صحار', en: 'Sohar' },
  { ar: 'نزوى', en: 'Nizwa' }, { ar: 'بهلاء', en: 'Bahla' }, { ar: 'صور', en: 'Sur' },
  { ar: 'البريمي', en: 'Al Buraimi' }, { ar: 'أخرى', en: 'Other' },
]

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  currency: Currency
  auto: boolean
  setCurrency: (c: Currency) => void
  setAuto: (a: boolean) => void
  t: (k: string) => string
  fmt: (n: number) => string
  sym: string
  cities: { ar: string; en: string }[]
}
const SettingsCtx = createContext<Ctx>(null as any)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('granoli_lang') as Lang) || 'ar')
  const [auto, setAutoState] = useState<boolean>(() => localStorage.getItem('granoli_auto') !== '0')
  const [currency, setCurrencyState] = useState<Currency>(() => (localStorage.getItem('granoli_currency') as Currency) || 'OMR')

  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('granoli_lang', l) }
  const setCurrency = (c: Currency) => {
    setCurrencyState(c); localStorage.setItem('granoli_currency', c)
    setAutoState(false); localStorage.setItem('granoli_auto', '0')
  }
  const setAuto = (a: boolean) => { setAutoState(a); localStorage.setItem('granoli_auto', a ? '1' : '0') }

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    if (!auto) return
    fetch('https://ipwho.is/')
      .then(r => r.json())
      .then(d => { const c = COUNTRY_CURRENCY[String(d.country_code || '').toUpperCase()]; if (c) { setCurrencyState(c); localStorage.setItem('granoli_currency', c) } })
      .catch(() => {})
  }, [auto])

  const t = (k: string) => TX[lang][k] ?? TX.ar[k] ?? k
  const fmt = (n: number) => {
    const val = n * RATES[currency]
    return `${val.toFixed(2)} ${lang === 'ar' ? SYM_AR[currency] : SYM_EN[currency]}`
  }

  return (
    <SettingsCtx.Provider value={{ lang, setLang, currency, auto, setCurrency, setAuto, t, fmt, sym: lang === 'ar' ? SYM_AR[currency] : SYM_EN[currency], cities: CITY_LIST }}>
      {children}
    </SettingsCtx.Provider>
  )
}

export const useL = () => useContext(SettingsCtx)