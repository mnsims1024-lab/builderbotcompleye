CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"client_id" text NOT NULL,
	"name" text NOT NULL,
	"prompt" text NOT NULL,
	"summary" text NOT NULL,
	"files" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
