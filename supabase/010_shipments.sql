-- ============================================================
-- Migration: Tambah tabel shipments untuk sistem pengiriman
-- Cukain Aja — Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Enum kurir
DO $$ BEGIN
  CREATE TYPE courier_type AS ENUM (
    'jne', 'jnt', 'sicepat', 'wahana', 'pos', 'anteraja'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Enum status pengiriman
DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM (
    'processing',       -- Diproses oleh admin/seller
    'picked_up',        -- Dijemput kurir
    'in_transit',       -- Dalam perjalanan
    'out_for_delivery', -- Sedang diantarkan
    'delivered',        -- Terkirim
    'failed'            -- Gagal kirim
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Tabel shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier              courier_type NOT NULL,
  tracking_number      TEXT NOT NULL,                    -- resi dari kurir (e.g. JNE: 1234567890)
  internal_tracking_id TEXT NOT NULL UNIQUE,             -- resi internal: CKJ-YYYYMMDD-XXXXXX
  status               shipment_status NOT NULL DEFAULT 'processing',
  estimated_delivery   DATE,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT shipments_order_unique UNIQUE (order_id)   -- 1 shipment per order
);

-- 4. Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_shipments_order_id
  ON public.shipments (order_id);

CREATE INDEX IF NOT EXISTS idx_shipments_internal_tracking_id
  ON public.shipments (internal_tracking_id);

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shipments_updated_at ON public.shipments;
CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION update_shipments_updated_at();

-- 6. RLS Policies
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admin full access on shipments"
  ON public.shipments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- User: hanya bisa SELECT shipment miliknya sendiri
CREATE POLICY "User can view own shipments"
  ON public.shipments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipments.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Public (anon): hanya bisa SELECT via internal_tracking_id (tracking publik)
CREATE POLICY "Public can track shipment by internal ID"
  ON public.shipments
  FOR SELECT
  TO anon, authenticated
  USING (true); -- filter by internal_tracking_id di level aplikasi

-- ============================================================
-- Selesai! Refresh browser Supabase untuk melihat tabel baru.
-- ============================================================
