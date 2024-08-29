ALTER TABLE "coaches" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "conferences" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "gamestats" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "stadiums" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "teamstats" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "userfavoriteteams" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET MAXVALUE 9223372036850000000;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "abbreviation" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "games_played" integer;