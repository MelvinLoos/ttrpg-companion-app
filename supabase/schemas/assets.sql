CREATE TABLE public.session_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gm_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('portrait', 'scene', 'map')),
  storage_bucket text NOT NULL CHECK (storage_bucket IN ('portraits', 'scenes', 'maps')),
  storage_path text NOT NULL,
  public_url text,
  friendly_name text,
  created_at timestamptz DEFAULT now()
);

-- Add index for asset type lookups
CREATE INDEX idx_session_assets_type ON public.session_assets(asset_type);

-- Enable RLS
ALTER TABLE public.session_assets ENABLE ROW LEVEL SECURITY;