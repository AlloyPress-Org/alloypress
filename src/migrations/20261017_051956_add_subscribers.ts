import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Subscribers only.
 * Auto-generated migration-la irundha homepage_settings (CREATE) and
 * payload_jobs (DROP) lines ellaam venum-ne remove panniyirukkom.
 * Idempotent: DB-la already irundhaalum fail aagaadhu.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_subscribers_interests" AS ENUM('guides-tutorials', 'tools-recommendations', 'reviews-comparisons', 'news-updates');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_subscribers_status" AS ENUM('active', 'unsubscribed');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE TABLE IF NOT EXISTS "subscribers_interests" (
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "value" "enum_subscribers_interests",
    "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "subscribers" (
    "id" serial PRIMARY KEY NOT NULL,
    "email" varchar NOT NULL,
    "status" "enum_subscribers_status" DEFAULT 'active' NOT NULL,
    "source" varchar,
    "country_code" varchar,
    "country" varchar,
    "subscribed_at" timestamp(3) with time zone,
    "unsubscribed_at" timestamp(3) with time zone,
    "unsubscribe_token" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "subscribers_id" integer;

  DO $$ BEGIN
    ALTER TABLE "subscribers_interests" ADD CONSTRAINT "subscribers_interests_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "subscribers_interests_order_idx" ON "subscribers_interests" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "subscribers_interests_parent_idx" ON "subscribers_interests" USING btree ("parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_email_idx" ON "subscribers" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "subscribers_status_idx" ON "subscribers" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "subscribers_source_idx" ON "subscribers" USING btree ("source");
  CREATE INDEX IF NOT EXISTS "subscribers_country_code_idx" ON "subscribers" USING btree ("country_code");
  CREATE INDEX IF NOT EXISTS "subscribers_unsubscribe_token_idx" ON "subscribers" USING btree ("unsubscribe_token");
  CREATE INDEX IF NOT EXISTS "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subscribers_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_subscribers_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subscribers_id";

  DROP TABLE IF EXISTS "subscribers_interests" CASCADE;
  DROP TABLE IF EXISTS "subscribers" CASCADE;

  DROP TYPE IF EXISTS "public"."enum_subscribers_interests";
  DROP TYPE IF EXISTS "public"."enum_subscribers_status";`)
}