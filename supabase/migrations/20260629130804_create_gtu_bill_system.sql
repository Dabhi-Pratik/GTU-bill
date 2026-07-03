/*
# GTU External Examiner Bill System — Initial Schema

## Overview
Creates the complete schema for the GTU External Examiner Bill Generation System.
Multi-user app: each user authenticates and owns their own bills/profile.

## New Tables

### `profiles`
Stores additional information about each registered user beyond what Supabase Auth provides.
- `id` (uuid, PK) — matches `auth.users.id`
- `full_name` (text) — examiner's full name
- `designation` (text) — examiner's designation
- `basic_pay` (text) — basic pay (old)
- `institute_name` (text) — default institute name and address
- `pan_no` (text) — PAN number
- `aadhar_no` (text) — Aadhar number
- `phone_no` (text) — phone number
- `email` (text) — email address
- `bank_name` (text) — bank name for EFT
- `branch_code` (text) — bank branch code
- `ac_type` (text) — account type SB/CB
- `ac_no` (text) — account number
- `ifsc_code` (text) — IFSC code
- `created_at`, `updated_at` (timestamps)

### `bills`
Stores every generated GTU External Examiner Bill.
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, NOT NULL, DEFAULT auth.uid())
- `bill_date` (date)
- `full_name`, `designation`, `basic_pay`, `institute_name`, `pan_no`, `aadhar_no`, `phone_no`, `email` — personal info
- `purpose_semester` (text) — BE semester number
- `reference_letter_no` (text)
- `ta_rows` (jsonb) — array of TA journey rows [{date, from, to, distance, mode, class, fare, remark}]
- `ta_total` (numeric)
- `da_days`, `da_rate`, `da_total` (numeric)
- `honorarium_days`, `honorarium_rate`, `honorarium_total`, `total_students` (numeric)
- `accommodation_days`, `accommodation_rate`, `accommodation_total` (numeric)
- `gross_total` (numeric)
- `railway_class` (text) — for declaration
- `vehicle_no` (text)
- `advance_received` (numeric)
- `remaining_amount` (numeric)
- `receipt_no` (text)
- `receipt_dated` (text)
- `bank_name`, `branch_code`, `ac_type`, `ac_no`, `ifsc_code` — bank details
- `created_at` (timestamp)
- `status` (text) — 'draft' | 'generated'

## Security
- RLS enabled on both tables.
- All policies scoped to `authenticated` role.
- Users can only read/write their own rows via `auth.uid() = user_id` or `auth.uid() = id`.
*/

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  designation text DEFAULT '',
  basic_pay text DEFAULT '',
  institute_name text DEFAULT '',
  pan_no text DEFAULT '',
  aadhar_no text DEFAULT '',
  phone_no text DEFAULT '',
  email text DEFAULT '',
  bank_name text DEFAULT '',
  branch_code text DEFAULT '',
  ac_type text DEFAULT 'SB',
  ac_no text DEFAULT '',
  ifsc_code text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- BILLS TABLE
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_date text DEFAULT '',
  full_name text DEFAULT '',
  designation text DEFAULT '',
  basic_pay text DEFAULT '',
  institute_name text DEFAULT '',
  pan_no text DEFAULT '',
  aadhar_no text DEFAULT '',
  phone_no text DEFAULT '',
  email text DEFAULT '',
  purpose_semester text DEFAULT '',
  reference_letter_no text DEFAULT '',
  ta_rows jsonb DEFAULT '[]'::jsonb,
  ta_total numeric DEFAULT 0,
  da_days numeric DEFAULT 0,
  da_rate numeric DEFAULT 0,
  da_total numeric DEFAULT 0,
  honorarium_days numeric DEFAULT 0,
  honorarium_rate numeric DEFAULT 0,
  honorarium_total numeric DEFAULT 0,
  total_students numeric DEFAULT 0,
  accommodation_days numeric DEFAULT 0,
  accommodation_rate numeric DEFAULT 0,
  accommodation_total numeric DEFAULT 0,
  gross_total numeric DEFAULT 0,
  railway_class text DEFAULT '',
  vehicle_no text DEFAULT '',
  advance_received numeric DEFAULT 0,
  remaining_amount numeric DEFAULT 0,
  receipt_no text DEFAULT '',
  receipt_dated text DEFAULT '',
  bank_name text DEFAULT '',
  branch_code text DEFAULT '',
  ac_type text DEFAULT 'SB',
  ac_no text DEFAULT '',
  ifsc_code text DEFAULT '',
  status text DEFAULT 'generated',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bills_user_id_idx ON bills(user_id);
CREATE INDEX IF NOT EXISTS bills_created_at_idx ON bills(created_at DESC);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bills" ON bills;
CREATE POLICY "select_own_bills" ON bills FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bills" ON bills;
CREATE POLICY "insert_own_bills" ON bills FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bills" ON bills;
CREATE POLICY "update_own_bills" ON bills FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bills" ON bills;
CREATE POLICY "delete_own_bills" ON bills FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
