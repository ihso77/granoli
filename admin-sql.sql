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