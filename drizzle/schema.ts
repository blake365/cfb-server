import {
	pgTable,
	foreignKey,
	text,
	integer,
	bigint,
	timestamp,
	boolean,
	serial,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const seasons = pgTable('seasons', {
	id: serial('id').primaryKey(),
	year: integer('year').notNull(),
	name: text('name'),
})

export const conferences = pgTable('conferences', {
	id: serial('id').primaryKey(),
	cfbApiId: integer('cfb_api_id'),
	name: text('name').notNull(),
	fullName: text('full_name'),
	abbreviation: text('abbreviation'),
	classification: text('classification'),
	division: text('division'),
	icon: text('icon'),
})

export const teams = pgTable(
	'teams',
	{
		id: serial('id').unique(),
		cfbApiId: integer('cfb_api_id').primaryKey(),
		name: text('name').notNull(),
		abbreviation: text('abbreviation'),
		mascot: text('mascot'),
		wins: integer('wins'),
		losses: integer('losses'),
		ties: integer('ties'),
		conferenceWins: integer('conference_wins'),
		conferenceLosses: integer('conference_losses'),
		conferenceTies: integer('conference_ties'),
		headCoach: text('head_coach'),
		establishedYear: integer('established_year'),
		seasonId: serial('season_id'),
		conferenceId: serial('conference_id'),
		stadiumId: serial('stadium_id'),
		location: text('location'),
		icon: text('icon'),
		logo: text('logo'),
		apRank: integer('ap_rank'),
		coachesRank: integer('coaches_rank'),
		cfpRank: integer('cfp_rank'),
		primaryColor: text('primary_color'),
		secondaryColor: text('secondary_color'),
		gamesPlayed: integer('games_played'),
		division: text('division'),
		rivals: text('rivals')
			.array()
			.notNull()
			.default(sql`ARRAY[]::text[]`),
	},
	(table) => {
		return {
			teamsSeasonIdFkey: foreignKey({
				columns: [table.seasonId],
				foreignColumns: [seasons.id],
				name: 'teams_season_id_fkey',
			}),
			teamsConferenceIdFkey: foreignKey({
				columns: [table.conferenceId],
				foreignColumns: [conferences.id],
				name: 'teams_conference_id_fkey',
			}),
		}
	}
)

export const teamstats = pgTable(
	'teamstats',
	{
		id: serial('id').primaryKey(),
		teamId: integer('team_id'),
		seasonId: serial('season_id'),
		passingYards: integer('passing_yards'),
		rushingYards: integer('rushing_yards'),
		turnovers: integer('turnovers'),
		totalTouchdowns: integer('total_touchdowns'),
		yardsAllowed: integer('yards_allowed'),
		takeaways: integer('takeaways'),
		totalYards: integer('total_yards'),
		rushingYardsAllowed: integer('rushing_yards_allowed'),
		passingYardsAllowed: integer('passing_yards_allowed'),
	},
	(table) => {
		return {
			teamstatsTeamIdFkey: foreignKey({
				columns: [table.teamId],
				foreignColumns: [teams.cfbApiId],
				name: 'teamstats_team_id_fkey',
			}),
			teamstatsSeasonIdFkey: foreignKey({
				columns: [table.seasonId],
				foreignColumns: [seasons.id],
				name: 'teamstats_season_id_fkey',
			}),
		}
	}
)

export const gamestats = pgTable(
	'gamestats',
	{
		id: serial('id').primaryKey(),
		gameId: serial('game_id'),
		teamId: integer('team_id'),
		passingYards: integer('passing_yards'),
		rushingYards: integer('rushing_yards'),
		turnovers: integer('turnovers'),
		totalTouchdowns: integer('total_touchdowns'),
		yardsAllowed: integer('yards_allowed'),
		takeaways: integer('takeaways'),
		totalYards: integer('total_yards'),
		rushingYardsAllowed: integer('rushing_yards_allowed'),
		passingYardsAllowed: integer('passing_yards_allowed'),
	},
	(table) => {
		return {
			gamestatsGameIdFkey: foreignKey({
				columns: [table.gameId],
				foreignColumns: [games.id],
				name: 'gamestats_game_id_fkey',
			}),
			gamestatsTeamIdFkey: foreignKey({
				columns: [table.teamId],
				foreignColumns: [teams.cfbApiId],
				name: 'gamestats_team_id_fkey',
			}),
		}
	}
)

export const games = pgTable(
	'games',
	{
		id: serial('id').primaryKey(),
		cfbApiId: integer('cfb_api_id'),
		homeTeamId: integer('home_team_id'),
		awayTeamId: integer('away_team_id'),
		gameStart: timestamp('game_start', {
			withTimezone: true,
			mode: 'string',
		}),
		homeTeamScore: integer('home_team_score'),
		awayTeamScore: integer('away_team_score'),
		stadiumId: serial('stadium_id'),
		location: text('location'),
		seasonId: serial('season_id'),
		week: integer('week'),
		type: text('type'),
		tvNetwork: text('tv_network'),
		rivalry: boolean('rivalry').default(false),
		interestScore: integer('interest_score').default(40),
	},
	(table) => {
		return {
			gamesHomeTeamIdFkey: foreignKey({
				columns: [table.homeTeamId],
				foreignColumns: [teams.cfbApiId],
				name: 'games_home_team_id_fkey',
			}),
			gamesAwayTeamIdFkey: foreignKey({
				columns: [table.awayTeamId],
				foreignColumns: [teams.cfbApiId],
				name: 'games_away_team_id_fkey',
			}),
			gamesSeasonIdFkey: foreignKey({
				columns: [table.seasonId],
				foreignColumns: [seasons.id],
				name: 'games_season_id_fkey',
			}),
		}
	}
)

export const interactions = pgTable(
	'interactions',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id'),
		gameId: serial('game_id'),
		interactionType: text('interaction_type'),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
	},
	(table) => {
		return {
			interactionsGameIdFkey: foreignKey({
				columns: [table.gameId],
				foreignColumns: [games.id],
				name: 'interactions_game_id_fkey',
			}),
		}
	}
)
