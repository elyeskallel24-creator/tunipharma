
-- Make legacy fields optional and add new ones
ALTER TABLE public.orders
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN order_number DROP NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS contact_method text,
  ADD COLUMN IF NOT EXISTS wilaya text;

-- Attach the order_number generator trigger if missing
DROP TRIGGER IF EXISTS trg_orders_set_number ON public.orders;
CREATE TRIGGER trg_orders_set_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

DROP TRIGGER IF EXISTS trg_orders_touch ON public.orders;
CREATE TRIGGER trg_orders_touch
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Prescription orders
CREATE TABLE IF NOT EXISTS public.prescription_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  contact_method text NOT NULL,
  wilaya text NOT NULL,
  address text NOT NULL,
  prescription_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prescription_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create prescription orders" ON public.prescription_orders;
CREATE POLICY "Anyone can create prescription orders"
  ON public.prescription_orders FOR INSERT
  TO public
  WITH CHECK (true);

-- Order number generator (reuse pattern)
CREATE OR REPLACE FUNCTION public.set_prescription_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'RX-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random()*10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rx_orders_set_number ON public.prescription_orders;
CREATE TRIGGER trg_rx_orders_set_number
  BEFORE INSERT ON public.prescription_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_prescription_order_number();

DROP TRIGGER IF EXISTS trg_rx_orders_touch ON public.prescription_orders;
CREATE TRIGGER trg_rx_orders_touch
  BEFORE UPDATE ON public.prescription_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
