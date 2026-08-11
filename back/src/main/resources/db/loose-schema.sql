-- Optional one-shot: loosen existing PostgreSQL constraints (keeps all data).
-- Skip the admins table. Run against your schema (retap / nfc) if Hibernate update
-- did not drop NOT NULL on already-created columns.
--
-- Example:
--   SET search_path TO retap;
--   \i loose-schema.sql

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = current_schema()
      AND c.table_name <> 'admins'
      AND c.is_nullable = 'NO'
      AND c.column_name NOT IN (
        -- keep primary keys / identity columns
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = current_schema()
          AND tc.table_name = c.table_name
          AND tc.constraint_type = 'PRIMARY KEY'
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL',
      r.table_name,
      r.column_name
    );
  END LOOP;
END $$;

-- Widen common string columns for future expansion (no data loss).
ALTER TABLE IF EXISTS tags ALTER COLUMN tag_id TYPE varchar(100);
ALTER TABLE IF EXISTS tags ALTER COLUMN store_id TYPE varchar(100);
ALTER TABLE IF EXISTS tags ALTER COLUMN category TYPE varchar(50);
ALTER TABLE IF EXISTS tags ALTER COLUMN nickname TYPE varchar(100);
ALTER TABLE IF EXISTS tags ALTER COLUMN status TYPE varchar(50);
ALTER TABLE IF EXISTS tags ALTER COLUMN experience_type TYPE varchar(50);

ALTER TABLE IF EXISTS stores ALTER COLUMN store_id TYPE varchar(100);
ALTER TABLE IF EXISTS stores ALTER COLUMN category TYPE varchar(50);
ALTER TABLE IF EXISTS stores ALTER COLUMN store_name TYPE varchar(200);
ALTER TABLE IF EXISTS stores ALTER COLUMN registered_by_name TYPE varchar(200);

ALTER TABLE IF EXISTS tag_excel_orders ALTER COLUMN file_name TYPE varchar(500);
ALTER TABLE IF EXISTS tag_excel_orders ALTER COLUMN storage_path TYPE varchar(1000);
ALTER TABLE IF EXISTS tag_excel_orders ALTER COLUMN category TYPE varchar(50);

ALTER TABLE IF EXISTS tag_excel_order_counters ALTER COLUMN category TYPE varchar(50);

ALTER TABLE IF EXISTS notices ALTER COLUMN title TYPE varchar(500);

ALTER TABLE IF EXISTS "Weekly_log" ALTER COLUMN id TYPE varchar(100);
ALTER TABLE IF EXISTS "Weekly_log" ALTER COLUMN store_id TYPE varchar(100);
ALTER TABLE IF EXISTS "Weekly_log" ALTER COLUMN day_of_week TYPE varchar(30);

ALTER TABLE IF EXISTS seven_day_log ALTER COLUMN id TYPE varchar(100);
ALTER TABLE IF EXISTS seven_day_log ALTER COLUMN store_id TYPE varchar(100);
ALTER TABLE IF EXISTS seven_day_log ALTER COLUMN day_of_week TYPE varchar(30);

ALTER TABLE IF EXISTS monthly_log ALTER COLUMN id TYPE varchar(100);
ALTER TABLE IF EXISTS monthly_log ALTER COLUMN store_id TYPE varchar(100);
ALTER TABLE IF EXISTS monthly_log ALTER COLUMN most_clicked_day_of_week TYPE varchar(30);
