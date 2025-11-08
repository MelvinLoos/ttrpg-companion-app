-- Add missing SELECT policy for session_assets
create policy "assets_owner_select"
on "public"."session_assets"
as permissive
for select
to authenticated
using ((gm_id = auth.uid()));