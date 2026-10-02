CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  flavor TEXT NOT NULL UNIQUE,
  price_250 DECIMAL(10,2),
  price_500 DECIMAL(10,2),
  price_daily DECIMAL(10,2),
  category TEXT DEFAULT 'granola',
  image_url TEXT,
  stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Orders
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  total DECIMAL(10,2) NOT NULL,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  payment_method TEXT DEFAULT 'card',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  weight TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products public" ON products FOR SELECT USING (true);
CREATE POLICY "Admins insert products" ON products FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));
CREATE POLICY "Admins update products" ON products FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));
CREATE POLICY "Admins delete products" ON products FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));
CREATE POLICY "Orders own select" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Orders own insert" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Orders own update" ON orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Order items own" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Profiles public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles own insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles own update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Seed products
INSERT INTO products (name_ar, name_en, description_ar, description_en, flavor, price_250, price_500, price_daily) VALUES
('كلاسيك', 'Classic', 'قمح كامل مقرمش مع مكسرات وبذور مختارة', 'Whole crispy oats with selected nuts and seeds', 'classic', 4, 6, NULL),
('أورتشارد', 'Orchard', 'مزيج فواكه طازجة بنكهة حلوة طبيعية', 'Fresh fruit blend with natural sweetness', 'orchard', 4, 6, NULL),
('ويلد بلوم', 'Wild Bloom', 'نكهة توت غنية بعمق الفواكه البرية', 'Rich berry flavor with wild fruit depth', 'bloom', 4, 6, NULL),
('غولدن بِيكان', 'Golden Pecan', 'قمح مقرمش مع عسل طبيعي وبِيكان محمص', 'Crispy oats with natural honey and roasted pecans', 'pecan', 4, 6, NULL),
('غرانولا يومية', 'Daily Granola', '12 جرعة فردية بحجم 40 جرام مثالية للإفطار اليومي', '12 individual 40g portions for daily breakfast', 'daily', NULL, NULL, 5);

-- ⭐ اجعل hassan309j@gmail.com أدمن (شغّل بعد إنشاء الحساب أو في أي وقت)
INSERT INTO profiles (id, full_name, is_admin)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), TRUE
FROM auth.users
WHERE email = 'hassan309j@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;

-- تأكد أن كل مستخدم مسجل له ملف شخصي
INSERT INTO profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══ Storage: صور المنتجات ═══
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins insert product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));
CREATE POLICY "Admins update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));
CREATE POLICY "Admins delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

-- ═══ Storage: صور المستخدمين ═══
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users insert own avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
CREATE POLICY "Users update own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- ═══ كوبونات الخصم ═══
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  percent INTEGER NOT NULL CHECK (percent > 0 AND percent <= 100),
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (TRUE);
CREATE POLICY "Admins insert coupons" ON coupons
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));
CREATE POLICY "Admins update coupons" ON coupons
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));
CREATE POLICY "Admins delete coupons" ON coupons
  FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));