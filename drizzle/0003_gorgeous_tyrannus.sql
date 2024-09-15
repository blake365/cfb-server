CREATE TABLE IF NOT EXISTS "interactions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "interactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036850000000 START WITH 1 CACHE 1),
	"user_id" bigint,
	"game_id" bigint,
	"interaction_type" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "week" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "rivalry" boolean;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "watch" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "sicko" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "fire" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "upset" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "interest_score" integer;--> statement-breakpoint
ALTER TABLE "stadiums" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "stadiums" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "stadiums" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "location" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interactions" ADD CONSTRAINT "interactions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_name_unique" UNIQUE("name");