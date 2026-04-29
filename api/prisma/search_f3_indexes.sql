-- Optimasi indeks untuk fitur Search (F3) pada tabel GABUNG.
-- Jalankan script ini pada database PostgreSQL yang dipakai aplikasi.
--
-- Fokus:
-- 1. ORDER BY "COMPANY"
-- 2. pencarian contains/ILIKE case-insensitive pada kolom teks utama
--
-- Catatan:
-- - gin_trgm_ops efektif untuk pola LIKE/ILIKE '%kata%'.
-- - btree tetap dipakai untuk sort "COMPANY" ASC.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_gabung_company_sort
  ON public."GABUNG" ("COMPANY");

CREATE INDEX IF NOT EXISTS idx_gabung_company_trgm
  ON public."GABUNG" USING gin (LOWER("COMPANY") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_gabung_name_trgm
  ON public."GABUNG" USING gin (LOWER("NAME") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_gabung_email_trgm
  ON public."GABUNG" USING gin (LOWER("EMAIL") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_gabung_business_trgm
  ON public."GABUNG" USING gin (LOWER("BUSINESS") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_gabung_namauser_trgm
  ON public."GABUNG" USING gin (LOWER("NAMAUSER") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_gabung_city_trgm
  ON public."GABUNG" USING gin (LOWER("CITY") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_gabung_phone_trgm
  ON public."GABUNG" USING gin (LOWER("PHONE") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_gabung_handphone_trgm
  ON public."GABUNG" USING gin (LOWER("HANDPHONE") gin_trgm_ops);
