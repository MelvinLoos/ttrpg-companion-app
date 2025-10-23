CREATE TABLE public.session_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gm_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  friendly_name text,
  created_at timestamptz DEFAULT now()
);