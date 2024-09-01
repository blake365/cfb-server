ALTER TABLE "games" ADD COLUMN "rivalry" boolean;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "watch" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "sicko" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "fire" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "upset" integer;--> statement-breakpoint
ALTER TABLE "stadiums" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "stadiums" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "stadiums" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_name_unique" UNIQUE("name");