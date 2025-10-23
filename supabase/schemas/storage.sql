-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('scenes', 'scenes', true),
  ('maps', 'maps', true)
ON CONFLICT (id) DO UPDATE SET public = true;