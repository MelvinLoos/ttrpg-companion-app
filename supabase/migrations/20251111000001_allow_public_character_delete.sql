-- Allow public users (players) to delete characters from sessions
-- This is needed so players can leave sessions and remove their characters

create policy "session_characters_public_delete"
on "public"."session_characters"
as permissive
for delete
to public
using (true);

-- Also allow public users to update characters (for hand raising, etc.)
create policy "session_characters_public_update"
on "public"."session_characters"
as permissive
for update
to public
using (true)
with check (true);