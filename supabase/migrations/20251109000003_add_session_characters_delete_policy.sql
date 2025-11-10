-- Add DELETE policy for session_characters
-- Allow session owners (GMs) to delete characters from their sessions

create policy "session_characters_gm_delete"
on "public"."session_characters"
as permissive
for delete
to public
using (
  exists (
    select 1 from sessions 
    where sessions.id = session_characters.session_id 
    and sessions.gm_id = auth.uid()
  )
);

-- Also add UPDATE policy for future use
create policy "session_characters_gm_update"
on "public"."session_characters"
as permissive
for update
to public
using (
  exists (
    select 1 from sessions 
    where sessions.id = session_characters.session_id 
    and sessions.gm_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from sessions 
    where sessions.id = session_characters.session_id 
    and sessions.gm_id = auth.uid()
  )
);