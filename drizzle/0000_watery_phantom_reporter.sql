-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "players" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "players_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"team_id" bigint,
	"name" text NOT NULL,
	"position" text,
	"jersey_number" integer,
	"year" text
);
*/

--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "coaches" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "coaches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"team_id" bigint,
	"name" text NOT NULL,
	"role" text
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "locations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"city" text NOT NULL,
	"state" text,
	"country" text
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "seasons" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seasons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"year" integer NOT NULL,
	"name" text
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "stadiums" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stadiums_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"capacity" integer,
	"location_id" bigint,
	"link" text
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "conferences" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "conferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"division" text,
	"icon" text
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "teams" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "teams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"mascot" text,
	"wins" integer,
	"losses" integer,
	"ties" integer,
	"head_coach" text,
	"established_year" integer,
	"season_id" bigint,
	"conference_id" bigint,
	"stadium_id" bigint,
	"icon" text,
	"ap_rank" integer,
	"coaches_rank" integer,
	"cfp_rank" integer
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "teamstats" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "teamstats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"team_id" bigint,
	"season_id" bigint,
	"passing_yards" integer,
	"rushing_yards" integer,
	"turnovers" integer,
	"total_touchdowns" integer,
	"yards_allowed" integer,
	"takeaways" integer,
	"total_yards" integer,
	"rushing_yards_allowed" integer,
	"passing_yards_allowed" integer
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "gamestats" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gamestats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"game_id" bigint,
	"team_id" bigint,
	"passing_yards" integer,
	"rushing_yards" integer,
	"turnovers" integer,
	"total_touchdowns" integer,
	"yards_allowed" integer,
	"takeaways" integer,
	"total_yards" integer,
	"rushing_yards_allowed" integer,
	"passing_yards_allowed" integer
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "games" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "games_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"home_team_id" bigint,
	"away_team_id" bigint,
	"game_date" date NOT NULL,
	"home_team_score" integer,
	"away_team_score" integer,
	"stadium_id" bigint,
	"season_id" bigint,
	"game_time" time,
	"type" text,
	"tv_network" text,
	"winner_id" bigint
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_username_key" UNIQUE("username"),
	CONSTRAINT "users_email_key" UNIQUE("email")
);
*/
--> statement-breakpoint
/*
CREATE TABLE IF NOT EXISTS "userfavoriteteams" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userfavoriteteams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint,
	"team_id" bigint
);
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "coaches" ADD CONSTRAINT "coaches_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "stadiums" ADD CONSTRAINT "stadiums_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_conference_id_fkey" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_stadium_id_fkey" FOREIGN KEY ("stadium_id") REFERENCES "public"."stadiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "teamstats" ADD CONSTRAINT "teamstats_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "teamstats" ADD CONSTRAINT "teamstats_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "gamestats" ADD CONSTRAINT "gamestats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "gamestats" ADD CONSTRAINT "gamestats_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "games" ADD CONSTRAINT "games_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "games" ADD CONSTRAINT "games_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "games" ADD CONSTRAINT "games_stadium_id_fkey" FOREIGN KEY ("stadium_id") REFERENCES "public"."stadiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "games" ADD CONSTRAINT "games_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "games" ADD CONSTRAINT "games_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "userfavoriteteams" ADD CONSTRAINT "userfavoriteteams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
*/
--> statement-breakpoint
/*
DO $$ BEGIN
 ALTER TABLE "userfavoriteteams" ADD CONSTRAINT "userfavoriteteams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/