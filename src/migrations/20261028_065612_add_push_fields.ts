import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_push_audience" AS ENUM('all', 'test');
  CREATE TYPE "public"."enum__posts_v_version_push_audience" AS ENUM('all', 'test');
  CREATE TYPE "public"."enum_image_slots_follow_mode" AS ENUM('nofollow', 'dofollow');
  CREATE TABLE "image_slots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"image_id" integer NOT NULL,
  	"link_url" varchar,
  	"follow_mode" "enum_image_slots_follow_mode" DEFAULT 'nofollow',
  	"sponsored" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "posts" ADD COLUMN "send_push" boolean DEFAULT true;
  ALTER TABLE "posts" ADD COLUMN "push_audience" "enum_posts_push_audience" DEFAULT 'all';
  ALTER TABLE "posts" ADD COLUMN "last_push_at" timestamp(3) with time zone;
  ALTER TABLE "_posts_v" ADD COLUMN "version_send_push" boolean DEFAULT true;
  ALTER TABLE "_posts_v" ADD COLUMN "version_push_audience" "enum__posts_v_version_push_audience" DEFAULT 'all';
  ALTER TABLE "_posts_v" ADD COLUMN "version_last_push_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "image_slots_id" integer;
  ALTER TABLE "image_slots" ADD CONSTRAINT "image_slots_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "image_slots_enabled_idx" ON "image_slots" USING btree ("enabled");
  CREATE INDEX "image_slots_image_idx" ON "image_slots" USING btree ("image_id");
  CREATE INDEX "image_slots_updated_at_idx" ON "image_slots" USING btree ("updated_at");
  CREATE INDEX "image_slots_created_at_idx" ON "image_slots" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_image_slots_fk" FOREIGN KEY ("image_slots_id") REFERENCES "public"."image_slots"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_image_slots_id_idx" ON "payload_locked_documents_rels" USING btree ("image_slots_id");`)

  // Existing posts must NOT re-send push: set OFF (only new posts default to ON)
  await db.execute(sql`UPDATE "posts" SET "send_push" = false`)
  await db.execute(sql`UPDATE "_posts_v" SET "version_send_push" = false`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_slots" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "image_slots" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_image_slots_fk";
  
  DROP INDEX "payload_locked_documents_rels_image_slots_id_idx";
  ALTER TABLE "posts" DROP COLUMN "send_push";
  ALTER TABLE "posts" DROP COLUMN "push_audience";
  ALTER TABLE "posts" DROP COLUMN "last_push_at";
  ALTER TABLE "_posts_v" DROP COLUMN "version_send_push";
  ALTER TABLE "_posts_v" DROP COLUMN "version_push_audience";
  ALTER TABLE "_posts_v" DROP COLUMN "version_last_push_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "image_slots_id";
  DROP TYPE "public"."enum_posts_push_audience";
  DROP TYPE "public"."enum__posts_v_version_push_audience";
  DROP TYPE "public"."enum_image_slots_follow_mode";`)
}