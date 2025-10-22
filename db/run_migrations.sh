#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
MIGRATION="$SCRIPT_DIR/migrations/0001_init.sql"

if command -v supabase >/dev/null 2>&1; then
  echo "Detected supabase CLI — using supabase db push"
  if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
    echo "Please set SUPABASE_PROJECT_REF env var or run 'supabase link'"
    exit 1
  fi
  supabase db push --file "$MIGRATION"
  exit 0
fi

if [ -z "${PGHOST:-}" ] || [ -z "${PGUSER:-}" ] || [ -z "${PGDATABASE:-}" ]; then
  echo "Missing PGHOST, PGUSER or PGDATABASE environment variables for psql."
  echo "Fallback usage: PGPASSWORD=<pw> psql \"host=<host> port=<port> dbname=<db> user=<user> sslmode=require\" -f $MIGRATION"
  exit 1
fi

echo "Running migration using psql"
psql "host=${PGHOST} port=${PGPORT:-5432} dbname=${PGDATABASE} user=${PGUSER} sslmode=require" -f "$MIGRATION"
