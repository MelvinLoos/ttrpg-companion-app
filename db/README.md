Database migrations and how to run them

This folder contains SQL migrations for the TTRPG Companion App.

Running migrations (recommended):

1) Using the Supabase CLI (recommended for Supabase projects):

   # login once
   supabase login

   # link to your project
   supabase link --project-ref <project-ref>

   # apply migration
   supabase db push --file db/migrations/0001_init.sql

2) Using psql (generic Postgres):

   PGPASSWORD=<password> psql "host=<host> port=<port> dbname=<db> user=<user> sslmode=require" -f db/migrations/0001_init.sql

Notes:
- The migration enables the `uuid-ossp` extension and creates initial tables used by the app.
- RLS policies are included as comments; enable and adapt them to your Supabase `auth.uid()` context after applying migrations.
