drop policy "sessions_owner" on "public"."sessions";

create policy "sessions_owner_delete"
on "public"."sessions"
as permissive
for delete
to public
using ((gm_id = auth.uid()));


create policy "sessions_owner_insert"
on "public"."sessions"
as permissive
for insert
to public
with check ((gm_id = auth.uid()));


create policy "sessions_owner_read"
on "public"."sessions"
as permissive
for select
to public
using ((gm_id = auth.uid()));


create policy "sessions_owner_update"
on "public"."sessions"
as permissive
for update
to public
using ((gm_id = auth.uid()))
with check ((gm_id = auth.uid()));



