-- Feature 3: Scene & Asset Management - Database Schema Updates
-- Part of Feature 3: Scene & Asset Management from Project Plan Phase 2

-- Step 1: Add type column to session_assets table
ALTER TABLE public.session_assets 
ADD COLUMN type text DEFAULT 'IMAGE' NOT NULL 
CHECK (type IN ('IMAGE', 'AUDIO'));

-- Step 2: Update existing assets to have type = 'IMAGE' 
UPDATE public.session_assets 
SET type = 'IMAGE' 
WHERE type IS NULL OR type = '';

-- Step 3: Add current_image_asset_id column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN current_image_asset_id uuid REFERENCES public.session_assets(id) ON DELETE SET NULL;

-- Step 4: Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_session_assets_type ON public.session_assets USING btree (type);
CREATE INDEX IF NOT EXISTS idx_sessions_current_image ON public.sessions USING btree (current_image_asset_id);

-- Step 5: Migrate existing active_image_url data (if any exists)
-- Note: This assumes active_image_url contains direct URLs, not asset references
-- We'll keep the active_image_url column for now for backward compatibility

-- Step 6: Update RLS policies to include the new type column
-- The existing policies should work with the new type column

-- Step 7: Enable realtime for sessions table changes (current_image_asset_id updates)
-- This should already be enabled from Feature 1, but ensuring it's there
