
-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

-- ============ PRODUCT TYPES ============
CREATE TABLE public.product_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active product types" ON public.product_types
  FOR SELECT USING (is_active = true);

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type_id UUID REFERENCES public.product_types(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  brand TEXT,
  sku TEXT,
  price NUMERIC(10,3) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,3),
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_type ON public.products(type_id);
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,3) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,3) NOT NULL DEFAULT 0,
  total NUMERIC(10,3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Anyone can place an order
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);
-- No public read; admin reads via service role server fn

-- Auto-generate order_number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'TP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random()*10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_set_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- ============ SLIDER IMAGES ============
CREATE TABLE public.slider_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  cta_text TEXT,
  cta_link TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.slider_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active slides" ON public.slider_images
  FOR SELECT USING (is_active = true);

-- ============ ABOUT CONTENT ============
CREATE TABLE public.about_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  image_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view about content" ON public.about_content
  FOR SELECT USING (true);

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view public settings" ON public.settings
  FOR SELECT USING (is_public = true);

-- ============ ADMIN PIN (private) ============
CREATE TABLE public.admin_pin (
  id INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
  pin_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE public.admin_pin ENABLE ROW LEVEL SECURITY;
-- No policies = no public access. Only service role can read/write.

-- Insert default PIN 3383 (sha256 hex)
-- sha256('3383') = 06b6ed8b67c45c46213d62f5b0c3127f60e76544b15f1b5b5e23bd5b4ad12c79
INSERT INTO public.admin_pin (id, pin_hash) VALUES
  (1, encode(digest('3383', 'sha256'), 'hex'));

-- pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Re-insert if extension wasn't there before (idempotent)
UPDATE public.admin_pin SET pin_hash = encode(digest('3383', 'sha256'), 'hex') WHERE id = 1;

-- ============ ADMIN SESSIONS (private) ============
CREATE TABLE public.admin_sessions (
  token TEXT NOT NULL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
-- No policies = no public access.

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_product_types_updated BEFORE UPDATE ON public.product_types
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_slider_updated BEFORE UPDATE ON public.slider_images
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_about_updated BEFORE UPDATE ON public.about_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ Storage bucket for product/slider/about images ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read on bucket
CREATE POLICY "Public read public-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'public-assets');

-- ============ Seed default settings + about ============
INSERT INTO public.settings (key, value, is_public) VALUES
  ('site', '{"name":"TuniPharma","tagline":"Votre pharmacie en ligne","phone":"+216 00 000 000","email":"contact@tunipharma.tn","address":"Tunis, Tunisie","delivery_fee":7}'::jsonb, true),
  ('seo', '{"title":"TuniPharma — Pharmacie & Parapharmacie en ligne en Tunisie","description":"Commandez vos médicaments et produits de parapharmacie en ligne avec livraison partout en Tunisie."}'::jsonb, true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.about_content (section_key, title, content, position) VALUES
  ('mission', 'Notre mission', 'TuniPharma rend l''accès aux médicaments et produits de parapharmacie simple, rapide et sécurisé partout en Tunisie.', 1),
  ('vision', 'Notre vision', 'Devenir la première pharmacie en ligne de référence en Tunisie en alliant expertise pharmaceutique et technologie.', 2),
  ('values', 'Nos valeurs', 'Confiance, qualité, accessibilité et service client d''excellence.', 3)
ON CONFLICT (section_key) DO NOTHING;
