drop policy "premade_characters_owner_delete" on "public"."premade_characters";

drop policy "premade_characters_owner_insert" on "public"."premade_characters";

drop policy "premade_characters_owner_update" on "public"."premade_characters";

drop policy "premade_characters_public_read" on "public"."premade_characters";

drop policy "assets_owner_write" on "public"."session_assets";

CREATE INDEX idx_session_assets_type ON public.session_assets USING btree (asset_type);

alter table "public"."session_assets" add constraint "session_assets_asset_type_check" CHECK ((asset_type = ANY (ARRAY['portrait'::text, 'scene'::text, 'map'::text]))) not valid;

alter table "public"."session_assets" validate constraint "session_assets_asset_type_check";

alter table "public"."session_assets" add constraint "session_assets_storage_bucket_check" CHECK ((storage_bucket = ANY (ARRAY['portraits'::text, 'scenes'::text, 'maps'::text]))) not valid;

alter table "public"."session_assets" validate constraint "session_assets_storage_bucket_check";

create policy "assets_owner_delete"
on "public"."session_assets"
as permissive
for delete
to authenticated
using ((gm_id = auth.uid()));


create policy "assets_owner_insert"
on "public"."session_assets"
as permissive
for insert
to authenticated
with check ((gm_id = auth.uid()));


create policy "assets_owner_update"
on "public"."session_assets"
as permissive
for update
to authenticated
using ((gm_id = auth.uid()))
with check ((gm_id = auth.uid()));



-- We keep the storage policies from the previous migration

