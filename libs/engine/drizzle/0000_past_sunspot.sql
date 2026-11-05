CREATE TABLE "links" (
	"code" varchar(16) PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "links_created_at_idx" ON "links" USING btree ("created_at");