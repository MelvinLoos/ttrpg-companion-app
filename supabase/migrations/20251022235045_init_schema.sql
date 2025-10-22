create table "public"."premade_characters" (
    "id" uuid not null default uuid_generate_v4(),
    "gm_id" uuid,
    "name" text not null,
    "portrait_url" text,
    "stats_json" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."premade_characters" enable row level security;

create table "public"."session_assets" (
    "id" uuid not null default uuid_generate_v4(),
    "gm_id" uuid,
    "asset_type" text not null,
    "storage_bucket" text not null,
    "storage_path" text not null,
    "public_url" text,
    "friendly_name" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."session_assets" enable row level security;

create table "public"."session_characters" (
    "id" uuid not null default uuid_generate_v4(),
    "session_id" uuid,
    "name" text not null,
    "portrait_url" text,
    "is_premade" boolean default false,
    "character_type" text default 'player'::text,
    "initiative_modifier" integer default 0,
    "initiative_roll" integer,
    "hand_raised" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."session_characters" enable row level security;

create table "public"."sessions" (
    "id" uuid not null default uuid_generate_v4(),
    "gm_id" uuid,
    "name" text not null,
    "showing" text not null default 'lobby'::text,
    "active_image_url" text,
    "teaser_text" text,
    "active_turn_character_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."sessions" enable row level security;

CREATE INDEX idx_premade_gm_id ON public.premade_characters USING btree (gm_id);

CREATE INDEX idx_session_characters_session_id ON public.session_characters USING btree (session_id);

CREATE INDEX idx_sessions_gm_id ON public.sessions USING btree (gm_id);

CREATE UNIQUE INDEX premade_characters_pkey ON public.premade_characters USING btree (id);

CREATE UNIQUE INDEX session_assets_pkey ON public.session_assets USING btree (id);

CREATE UNIQUE INDEX session_characters_pkey ON public.session_characters USING btree (id);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

alter table "public"."premade_characters" add constraint "premade_characters_pkey" PRIMARY KEY using index "premade_characters_pkey";

alter table "public"."session_assets" add constraint "session_assets_pkey" PRIMARY KEY using index "session_assets_pkey";

alter table "public"."session_characters" add constraint "session_characters_pkey" PRIMARY KEY using index "session_characters_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."premade_characters" add constraint "premade_characters_gm_id_fkey" FOREIGN KEY (gm_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."premade_characters" validate constraint "premade_characters_gm_id_fkey";

alter table "public"."session_assets" add constraint "session_assets_gm_id_fkey" FOREIGN KEY (gm_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."session_assets" validate constraint "session_assets_gm_id_fkey";

alter table "public"."session_characters" add constraint "session_characters_session_id_fkey" FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE not valid;

alter table "public"."session_characters" validate constraint "session_characters_session_id_fkey";

alter table "public"."sessions" add constraint "sessions_gm_id_fkey" FOREIGN KEY (gm_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."sessions" validate constraint "sessions_gm_id_fkey";

grant delete on table "public"."premade_characters" to "anon";

grant insert on table "public"."premade_characters" to "anon";

grant references on table "public"."premade_characters" to "anon";

grant select on table "public"."premade_characters" to "anon";

grant trigger on table "public"."premade_characters" to "anon";

grant truncate on table "public"."premade_characters" to "anon";

grant update on table "public"."premade_characters" to "anon";

grant delete on table "public"."premade_characters" to "authenticated";

grant insert on table "public"."premade_characters" to "authenticated";

grant references on table "public"."premade_characters" to "authenticated";

grant select on table "public"."premade_characters" to "authenticated";

grant trigger on table "public"."premade_characters" to "authenticated";

grant truncate on table "public"."premade_characters" to "authenticated";

grant update on table "public"."premade_characters" to "authenticated";

grant delete on table "public"."premade_characters" to "service_role";

grant insert on table "public"."premade_characters" to "service_role";

grant references on table "public"."premade_characters" to "service_role";

grant select on table "public"."premade_characters" to "service_role";

grant trigger on table "public"."premade_characters" to "service_role";

grant truncate on table "public"."premade_characters" to "service_role";

grant update on table "public"."premade_characters" to "service_role";

grant delete on table "public"."session_assets" to "anon";

grant insert on table "public"."session_assets" to "anon";

grant references on table "public"."session_assets" to "anon";

grant select on table "public"."session_assets" to "anon";

grant trigger on table "public"."session_assets" to "anon";

grant truncate on table "public"."session_assets" to "anon";

grant update on table "public"."session_assets" to "anon";

grant delete on table "public"."session_assets" to "authenticated";

grant insert on table "public"."session_assets" to "authenticated";

grant references on table "public"."session_assets" to "authenticated";

grant select on table "public"."session_assets" to "authenticated";

grant trigger on table "public"."session_assets" to "authenticated";

grant truncate on table "public"."session_assets" to "authenticated";

grant update on table "public"."session_assets" to "authenticated";

grant delete on table "public"."session_assets" to "service_role";

grant insert on table "public"."session_assets" to "service_role";

grant references on table "public"."session_assets" to "service_role";

grant select on table "public"."session_assets" to "service_role";

grant trigger on table "public"."session_assets" to "service_role";

grant truncate on table "public"."session_assets" to "service_role";

grant update on table "public"."session_assets" to "service_role";

grant delete on table "public"."session_characters" to "anon";

grant insert on table "public"."session_characters" to "anon";

grant references on table "public"."session_characters" to "anon";

grant select on table "public"."session_characters" to "anon";

grant trigger on table "public"."session_characters" to "anon";

grant truncate on table "public"."session_characters" to "anon";

grant update on table "public"."session_characters" to "anon";

grant delete on table "public"."session_characters" to "authenticated";

grant insert on table "public"."session_characters" to "authenticated";

grant references on table "public"."session_characters" to "authenticated";

grant select on table "public"."session_characters" to "authenticated";

grant trigger on table "public"."session_characters" to "authenticated";

grant truncate on table "public"."session_characters" to "authenticated";

grant update on table "public"."session_characters" to "authenticated";

grant delete on table "public"."session_characters" to "service_role";

grant insert on table "public"."session_characters" to "service_role";

grant references on table "public"."session_characters" to "service_role";

grant select on table "public"."session_characters" to "service_role";

grant trigger on table "public"."session_characters" to "service_role";

grant truncate on table "public"."session_characters" to "service_role";

grant update on table "public"."session_characters" to "service_role";

grant delete on table "public"."sessions" to "anon";

grant insert on table "public"."sessions" to "anon";

grant references on table "public"."sessions" to "anon";

grant select on table "public"."sessions" to "anon";

grant trigger on table "public"."sessions" to "anon";

grant truncate on table "public"."sessions" to "anon";

grant update on table "public"."sessions" to "anon";

grant delete on table "public"."sessions" to "authenticated";

grant insert on table "public"."sessions" to "authenticated";

grant references on table "public"."sessions" to "authenticated";

grant select on table "public"."sessions" to "authenticated";

grant trigger on table "public"."sessions" to "authenticated";

grant truncate on table "public"."sessions" to "authenticated";

grant update on table "public"."sessions" to "authenticated";

grant delete on table "public"."sessions" to "service_role";

grant insert on table "public"."sessions" to "service_role";

grant references on table "public"."sessions" to "service_role";

grant select on table "public"."sessions" to "service_role";

grant trigger on table "public"."sessions" to "service_role";

grant truncate on table "public"."sessions" to "service_role";

grant update on table "public"."sessions" to "service_role";

create policy "characters_owner"
on "public"."premade_characters"
as permissive
for all
to public
using ((gm_id = auth.uid()));


create policy "assets_owner_write"
on "public"."session_assets"
as permissive
for all
to public
using ((gm_id = auth.uid()))
with check ((gm_id = auth.uid()));


create policy "assets_public_read"
on "public"."session_assets"
as permissive
for select
to public
using (true);


create policy "session_characters_owner_write"
on "public"."session_characters"
as permissive
for insert
to public
with check (true);


create policy "session_characters_public_read"
on "public"."session_characters"
as permissive
for select
to public
using (true);


create policy "sessions_owner"
on "public"."sessions"
as permissive
for all
to public
using ((gm_id = auth.uid()));



