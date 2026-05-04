-- ============================================================
-- Migration: Tambah alamat pengiriman dan ongkos kirim
-- Cukain Aja — Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom alamat ke profiles (buyer & seller)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- 2. Tambah kolom shipping ke orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_name TEXT,
  ADD COLUMN IF NOT EXISTS shipping_phone TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS shipping_province TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_cost INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_zone TEXT; -- 'java' | 'outer_java'

-- ============================================================
-- Selesai! Refresh browser Supabase untuk melihat kolom baru.
-- ============================================================
