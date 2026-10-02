-- ═══════════ ADMIN + PROFILE FIELDS ═══════════
-- شغّل هذا في Supabase → SQL Editor

-- 1) إضافة الأعمدة للملفات الشخصية (إذا مو موجودة)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2) قراءة الملفات الشخصية متاحة للجميع (لإظهار الاسم والصورة)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (TRUE);

-- 2.5) ═══ منتجات: الإدراج والتعديل والحذف للأدمن فقط ═══
-- ⭐ عمود المخزون (الكمية المتوفرة) — تنقص مع كل طلب
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;

-- ⭐ دالة تنقص المخزون بأمان عند تأكيد الطلب (تتجاوز RLS بأمان)
CREATE OR REPLACE FUNCTION decrement_stock(p_id uuid, p_qty integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE current_stock integer;
BEGIN
  SELECT stock INTO current_stock FROM products WHERE id = p_id;
  IF current_stock IS NULL OR current_stock >= p_qty THEN
    UPDATE products SET stock = GREATEST(stock - p_qty, 0) WHERE id = p_id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END $$;

GRANT EXECUTE ON FUNCTION decrement_stock(uuid, integer) TO anon, authenticated;

DROP POLICY IF EXISTS "Admins insert products" ON products;
CREATE POLICY "Admins insert products" ON products
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

DROP POLICY IF EXISTS "Admins update products" ON products;
CREATE POLICY "Admins update products" ON products
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

DROP POLICY IF EXISTS "Admins delete products" ON products;
CREATE POLICY "Admins delete products" ON products
  FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

-- 3) المستخدم يحدث ملفه فقط
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4) المستخدم ينشئ ملفه فقط
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5) ⭐ جعل hassan309j@gmail.com أدمن
INSERT INTO profiles (id, full_name, is_admin)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), TRUE
FROM auth.users
WHERE email = 'hassan309j@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;

-- 6) تأكد أن كل مستخدم مسجل له ملف شخصي
INSERT INTO profiles (id, full_name, is_admin)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), FALSE
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7) ═══ صور المنتجات (Supabase Storage) ═══
-- إنشاء مجلد (Bucket) عام لصور المنتجات
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- القراءة عامة (باب الموقع يظهر الصور للجميع)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- رفع/تعديل/حذف فقط للأدمن
DROP POLICY IF EXISTS "Admins insert product images" ON storage.objects;
CREATE POLICY "Admins insert product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
CREATE POLICY "Admins update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;
CREATE POLICY "Admins delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

-- 8) ═══ ملفات المستخدمين (Avatar) ═══
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users insert own avatars" ON storage.objects;
CREATE POLICY "Users insert own avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
CREATE POLICY "Users update own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- 9) ═══ كوبونات الخصم ═══
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  percent INTEGER NOT NULL CHECK (percent > 0 AND percent <= 100),
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP POLICY IF EXISTS "Public read coupons" ON coupons;
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins insert coupons" ON coupons;
CREATE POLICY "Admins insert coupons" ON coupons
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

DROP POLICY IF EXISTS "Admins update coupons" ON coupons;
CREATE POLICY "Admins update coupons" ON coupons
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

DROP POLICY IF EXISTS "Admins delete coupons" ON coupons;
CREATE POLICY "Admins delete coupons" ON coupons
  FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

-- 10) ═══ الطلبات مباشرة في Supabase (بدون سيرفر — مهم لموقع Vercel) ═══
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS note TEXT;

DROP FUNCTION IF EXISTS place_order(JSONB, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE FUNCTION place_order(
  p_items JSONB,
  p_total NUMERIC,
  p_coupon TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_city TEXT,
  p_address TEXT,
  p_notes TEXT
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  order_id UUID;
  it JSONB;
  pid UUID;
  qty INT;
BEGIN
  INSERT INTO orders (user_id, status, total, shipping_name, shipping_phone, shipping_city, shipping_address, shipping_notes, payment_method, coupon_code)
  VALUES (auth.uid(), 'pending', p_total, p_name, p_phone, p_city, p_address, NULLIF(p_notes, ''), 'cod', NULLIF(p_coupon, ''))
  RETURNING id INTO order_id;

  IF order_id IS NULL THEN
    RAISE EXCEPTION 'تعذر إنشاء الطلب';
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    pid := NULLIF(it->>'productId', '')::uuid;
    qty := COALESCE((it->>'qty')::INT, 1);
    IF pid IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM products WHERE id = pid AND stock IS NOT NULL AND stock >= qty) THEN
        UPDATE products SET stock = stock - qty WHERE id = pid;
      ELSIF EXISTS (SELECT 1 FROM products WHERE id = pid AND stock IS NULL) THEN
        NULL;
      ELSE
        RAISE EXCEPTION 'الكمية غير كافية للمنتج %', pid;
      END IF;
    END IF;
    INSERT INTO order_items (order_id, product_id, product_name, quantity, weight, price, note)
    VALUES (order_id, pid, COALESCE(it->>'name_en', it->>'name_ar', 'منتج'), qty, COALESCE(it->>'weight', ''), COALESCE((it->>'price')::NUMERIC, 0), NULLIF(it->>'note', ''));
  END LOOP;

  RETURN order_id::text;
END $$;

GRANT EXECUTE ON FUNCTION place_order(JSONB, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

DROP POLICY IF EXISTS "Admins read orders" ON orders;
CREATE POLICY "Admins read orders" ON orders FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

DROP POLICY IF EXISTS "Admins update orders" ON orders;
CREATE POLICY "Admins update orders" ON orders FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

DROP POLICY IF EXISTS "Admins read order items" ON order_items;
CREATE POLICY "Admins read order items" ON order_items FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

-- 11) ═══ قائمة المستخدمين (للأدمن فقط) ═══
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  address TEXT,
  is_admin BOOLEAN,
  avatar_url TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'غير مسموح';
  END IF;
  RETURN QUERY
  SELECT u.id, u.email, u.created_at, u.last_sign_in_at,
         p.full_name, p.phone, p.city, p.address, COALESCE(p.is_admin, FALSE), p.avatar_url
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END $$;

GRANT EXECUTE ON FUNCTION admin_list_users() TO authenticated;