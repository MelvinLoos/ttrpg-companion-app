-- Add RLS policies for premade_characters table

-- Authenticated users can read all characters (for session loading)
create policy "premade_characters_public_read"
on "public"."premade_characters"
as permissive
for select
to authenticated
using (true);

-- Only the owner (GM) can insert new characters
create policy "premade_characters_owner_insert"
on "public"."premade_characters"
as permissive
for insert
to authenticated
with check (
  gm_id = auth.uid()
);

-- Only the owner (GM) can update their characters
create policy "premade_characters_owner_update"
on "public"."premade_characters"
as permissive
for update
to authenticated
using (gm_id = auth.uid())
with check (gm_id = auth.uid());

-- Only the owner (GM) can delete their characters
create policy "premade_characters_owner_delete"
on "public"."premade_characters"
as permissive
for delete
to authenticated
using (gm_id = auth.uid());