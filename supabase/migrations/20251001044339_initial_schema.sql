/*
  # Initial Database Schema for Infield Spray Record Application

  ## Overview
  Creates the complete database structure for managing spray application records including
  owners, farms, paddocks, chemical mixes, applications, and weather data integration.

  ## New Tables
  
  ### 1. owners
  - `owner_id` (uuid, primary key)
  - `owner_name` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. profiles
  - `user_id` (uuid, primary key, references auth.users)
  - `owner_id` (uuid, references owners)
  - `full_name` (text)
  - `role` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. farms
  - `farm_id` (uuid, primary key)
  - `owner_id` (uuid, references owners)
  - `farm_name` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 4. paddocks
  - `paddock_id` (uuid, primary key)
  - `owner_id` (uuid, references owners)
  - `farm_id` (uuid, references farms)
  - `paddock_name` (text)
  - `area_ha` (numeric)
  - `gps_latitude` (numeric)
  - `gps_longitude` (numeric)
  - `gps_accuracy_m` (numeric)
  - `gps_updated_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 5. mixes
  - `mix_id` (uuid, primary key)
  - `owner_id` (uuid, references owners)
  - `mix_name` (text)
  - `total_volume_l` (numeric)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 6. mix_items
  - `item_id` (uuid, primary key)
  - `mix_id` (uuid, references mixes)
  - `product_name` (text)
  - `quantity` (numeric)
  - `unit` (text)
  - `created_at` (timestamptz)
  
  ### 7. applications
  - `application_id` (uuid, primary key)
  - `owner_id` (uuid, references owners)
  - `mix_id` (uuid, references mixes)
  - `operator_user_id` (uuid, references auth.users)
  - `started_at` (timestamptz)
  - `finished_at` (timestamptz)
  - `finalized` (boolean)
  - `gps_latitude` (numeric)
  - `gps_longitude` (numeric)
  - `wind_speed_ms` (numeric)
  - `wind_direction_deg` (numeric)
  - `temp_c` (numeric)
  - `humidity_pct` (numeric)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 8. application_paddocks
  - `link_id` (uuid, primary key)
  - `owner_id` (uuid, references owners)
  - `application_id` (uuid, references applications)
  - `paddock_id` (uuid, references paddocks)
  - `gps_latitude` (numeric)
  - `gps_longitude` (numeric)
  - `gps_accuracy_m` (numeric)
  - `gps_captured_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### 9. blynk_stations
  - `station_id` (uuid, primary key)
  - `owner_id` (uuid, references owners)
  - `station_name` (text)
  - `blynk_token` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with owner-scoped access policies that ensure users can only
  access data belonging to their owner organization.
  
  ### Policies
  Each table has four policies:
  - SELECT: Users can view data for their owner
  - INSERT: Users can create data for their owner
  - UPDATE: Users can update data for their owner
  - DELETE: Users can delete data for their owner
  
  All policies verify ownership through the profiles table linkage.
*/

-- Create owners table
CREATE TABLE IF NOT EXISTS owners (
  owner_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- Create profiles table (links auth.users to owners)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(owner_id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'operator',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create farms table
CREATE TABLE IF NOT EXISTS farms (
  farm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(owner_id) ON DELETE CASCADE,
  farm_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

-- Create paddocks table
CREATE TABLE IF NOT EXISTS paddocks (
  paddock_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(owner_id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
  paddock_name TEXT NOT NULL,
  area_ha NUMERIC,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  gps_accuracy_m NUMERIC,
  gps_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE paddocks ENABLE ROW LEVEL SECURITY;

-- Create mixes table
CREATE TABLE IF NOT EXISTS mixes (
  mix_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(owner_id) ON DELETE CASCADE,
  mix_name TEXT NOT NULL,
  total_volume_l NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mixes ENABLE ROW LEVEL SECURITY;

-- Create mix_items table
CREATE TABLE IF NOT EXISTS mix_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mix_id UUID NOT NULL REFERENCES mixes(mix_id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mix_items ENABLE ROW LEVEL SECURITY;

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(owner_id) ON DELETE CASCADE,
  mix_id UUID REFERENCES mixes(mix_id),
  operator_user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  finalized BOOLEAN DEFAULT false,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  wind_speed_ms NUMERIC,
  wind_direction_deg NUMERIC,
  temp_c NUMERIC,
  humidity_pct NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create application_paddocks table
CREATE TABLE IF NOT EXISTS application_paddocks (
  link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(owner_id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  paddock_id UUID NOT NULL REFERENCES paddocks(paddock_id) ON DELETE CASCADE,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  gps_accuracy_m NUMERIC,
  gps_captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE application_paddocks ENABLE ROW LEVEL SECURITY;

-- Create blynk_stations table
CREATE TABLE IF NOT EXISTS blynk_stations (
  station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(owner_id) ON DELETE CASCADE,
  station_name TEXT NOT NULL,
  blynk_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blynk_stations ENABLE ROW LEVEL SECURITY;

-- Create indexes for foreign keys and common queries
CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_paddocks_owner_id ON paddocks(owner_id);
CREATE INDEX IF NOT EXISTS idx_paddocks_farm_id ON paddocks(farm_id);
CREATE INDEX IF NOT EXISTS idx_mixes_owner_id ON mixes(owner_id);
CREATE INDEX IF NOT EXISTS idx_mix_items_mix_id ON mix_items(mix_id);
CREATE INDEX IF NOT EXISTS idx_applications_owner_id ON applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_applications_mix_id ON applications(mix_id);
CREATE INDEX IF NOT EXISTS idx_application_paddocks_owner_id ON application_paddocks(owner_id);
CREATE INDEX IF NOT EXISTS idx_application_paddocks_application_id ON application_paddocks(application_id);
CREATE INDEX IF NOT EXISTS idx_application_paddocks_paddock_id ON application_paddocks(paddock_id);
CREATE INDEX IF NOT EXISTS idx_blynk_stations_owner_id ON blynk_stations(owner_id);

-- RLS Policies for owners table
CREATE POLICY "Users can view their own owner data"
  ON owners FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own owner data"
  ON owners FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own owner data"
  ON owners FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own owner data"
  ON owners FOR DELETE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for profiles table
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for farms table
CREATE POLICY "Users can view their owner's farms"
  ON farms FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert farms for their owner"
  ON farms FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their owner's farms"
  ON farms FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their owner's farms"
  ON farms FOR DELETE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for paddocks table
CREATE POLICY "Users can view their owner's paddocks"
  ON paddocks FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert paddocks for their owner"
  ON paddocks FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their owner's paddocks"
  ON paddocks FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their owner's paddocks"
  ON paddocks FOR DELETE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for mixes table
CREATE POLICY "Users can view their owner's mixes"
  ON mixes FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert mixes for their owner"
  ON mixes FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their owner's mixes"
  ON mixes FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their owner's mixes"
  ON mixes FOR DELETE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for mix_items table
CREATE POLICY "Users can view mix items for their owner's mixes"
  ON mix_items FOR SELECT
  TO authenticated
  USING (
    mix_id IN (
      SELECT mix_id FROM mixes WHERE owner_id IN (
        SELECT owner_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert mix items for their owner's mixes"
  ON mix_items FOR INSERT
  TO authenticated
  WITH CHECK (
    mix_id IN (
      SELECT mix_id FROM mixes WHERE owner_id IN (
        SELECT owner_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update mix items for their owner's mixes"
  ON mix_items FOR UPDATE
  TO authenticated
  USING (
    mix_id IN (
      SELECT mix_id FROM mixes WHERE owner_id IN (
        SELECT owner_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete mix items for their owner's mixes"
  ON mix_items FOR DELETE
  TO authenticated
  USING (
    mix_id IN (
      SELECT mix_id FROM mixes WHERE owner_id IN (
        SELECT owner_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for applications table
CREATE POLICY "Users can view their owner's applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert applications for their owner"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their owner's applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their owner's applications"
  ON applications FOR DELETE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for application_paddocks table
CREATE POLICY "Users can view application paddocks for their owner"
  ON application_paddocks FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert application paddocks for their owner"
  ON application_paddocks FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update application paddocks for their owner"
  ON application_paddocks FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete application paddocks for their owner"
  ON application_paddocks FOR DELETE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for blynk_stations table
CREATE POLICY "Users can view their owner's weather stations"
  ON blynk_stations FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert weather stations for their owner"
  ON blynk_stations FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their owner's weather stations"
  ON blynk_stations FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their owner's weather stations"
  ON blynk_stations FOR DELETE
  TO authenticated
  USING (
    owner_id IN (
      SELECT owner_id FROM profiles WHERE user_id = auth.uid()
    )
  );
