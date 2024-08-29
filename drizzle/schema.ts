import {
	pgTable,
	foreignKey,
	bigint,
	text,
	integer,
	date,
	time,
	unique,
	timestamp,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const players = pgTable(
	'players',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint('id', { mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'players_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036850000000,
				cache: 1,
			}),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		teamId: bigint('team_id', { mode: 'number' }),
		name: text('name').notNull(),
		position: text('position'),
		jerseyNumber: integer('jersey_number'),
		year: text('year'),
	},
	(table) => {
		return {
			playersTeamIdFkey: foreignKey({
				columns: [table.teamId],
				foreignColumns: [teams.id],
				name: 'players_team_id_fkey',
			}),
		}
	}
)

export const coaches = pgTable(
	'coaches',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint('id', { mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'coaches_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036850000000,
				cache: 1,
			}),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		teamId: bigint('team_id', { mode: 'number' }),
		name: text('name').notNull(),
		role: text('role'),
	},
	(table) => {
		return {
			coachesTeamIdFkey: foreignKey({
				columns: [table.teamId],
				foreignColumns: [teams.id],
				name: 'coaches_team_id_fkey',
			}),
		}
	}
)

export const locations = pgTable('locations', {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity({
		name: 'locations_id_seq',
		startWith: 1,
		increment: 1,
		minValue: 1,
		maxValue: 9223372036850000000,
		cache: 1,
	}),
	city: text('city').notNull(),
	state: text('state'),
	country: text('country'),
})

export const seasons = pgTable('seasons', {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity({
		name: 'seasons_id_seq',
		startWith: 1,
		increment: 1,
		minValue: 1,
		maxValue: 9223372036850000000,
		cache: 1,
	}),
	year: integer('year').notNull(),
	name: text('name'),
})

export const stadiums = pgTable(
	'stadiums',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint('id', { mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'stadiums_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036850000000,
				cache: 1,
			}),
		name: text('name').notNull(),
		capacity: integer('capacity'),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		locationId: bigint('location_id', { mode: 'number' }),
		link: text('link'),
	},
	(table) => {
		return {
			stadiumsLocationIdFkey: foreignKey({
				columns: [table.locationId],
				foreignColumns: [locations.id],
				name: 'stadiums_location_id_fkey',
			}),
		}
	}
)

export const conferences = pgTable('conferences', {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity({
		name: 'conferences_id_seq',
		startWith: 1,
		increment: 1,
		minValue: 1,
		maxValue: 9223372036850000000,
		cache: 1,
	}),
	name: text('name').notNull(),
	division: text('division'),
	icon: text('icon'),
})

export const teams = pgTable(
	'teams',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint('id', { mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'teams_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036850000000,
				cache: 1,
			}),
		name: text('name').notNull().unique(),
		abbreviation: text('abbreviation'),
		mascot: text('mascot'),
		wins: integer('wins'),
		losses: integer('losses'),
		ties: integer('ties'),
		headCoach: text('head_coach'),
		establishedYear: integer('established_year'),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		seasonId: bigint('season_id', { mode: 'number' }),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		conferenceId: bigint('conference_id', { mode: 'number' }),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		stadiumId: bigint('stadium_id', { mode: 'number' }),
		icon: text('icon'),
		apRank: integer('ap_rank'),
		coachesRank: integer('coaches_rank'),
		cfpRank: integer('cfp_rank'),
		primaryColor: text('primary_color'),
		secondaryColor: text('secondary_color'),
		gamesPlayed: integer('games_played'),
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
			teamsStadiumIdFkey: foreignKey({
				columns: [table.stadiumId],
				foreignColumns: [stadiums.id],
				name: 'teams_stadium_id_fkey',
			}),
		}
	}
)

export const teamstats = pgTable(
	'teamstats',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint('id', { mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'teamstats_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036850000000,
				cache: 1,
			}),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		teamId: bigint('team_id', { mode: 'number' }),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		seasonId: bigint('season_id', { mode: 'number' }),
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
				foreignColumns: [teams.id],
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
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint('id', { mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'gamestats_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036850000000,
				cache: 1,
			}),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		gameId: bigint('game_id', { mode: 'number' }),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		teamId: bigint('team_id', { mode: 'number' }),
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
				foreignColumns: [teams.id],
				name: 'gamestats_team_id_fkey',
			}),
		}
	}
)

export const games = pgTable(
	'games',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint('id', { mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'games_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036850000000,
				cache: 1,
			}),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		homeTeamId: bigint('home_team_id', { mode: 'number' }),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		awayTeamId: bigint('away_team_id', { mode: 'number' }),
		gameDate: date('game_date').notNull(),
		homeTeamScore: integer('home_team_score'),
		awayTeamScore: integer('away_team_score'),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		stadiumId: bigint('stadium_id', { mode: 'number' }),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		seasonId: bigint('season_id', { mode: 'number' }),
		gameTime: time('game_time'),
		type: text('type'),
		tvNetwork: text('tv_network'),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		winnerId: bigint('winner_id', { mode: 'number' }),
	},
	(table) => {
		return {
			gamesHomeTeamIdFkey: foreignKey({
				columns: [table.homeTeamId],
				foreignColumns: [teams.id],
				name: 'games_home_team_id_fkey',
			}),
			gamesAwayTeamIdFkey: foreignKey({
				columns: [table.awayTeamId],
				foreignColumns: [teams.id],
				name: 'games_away_team_id_fkey',
			}),
			gamesStadiumIdFkey: foreignKey({
				columns: [table.stadiumId],
				foreignColumns: [stadiums.id],
				name: 'games_stadium_id_fkey',
			}),
			gamesSeasonIdFkey: foreignKey({
				columns: [table.seasonId],
				foreignColumns: [seasons.id],
				name: 'games_season_id_fkey',
			}),
			gamesWinnerIdFkey: foreignKey({
				columns: [table.winnerId],
				foreignColumns: [teams.id],
				name: 'games_winner_id_fkey',
			}),
		}
	}
)

export const users = pgTable(
	'users',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint('id', { mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'users_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036850000000,
				cache: 1,
			}),
		username: text('username').notNull(),
		email: text('email').notNull(),
		passwordHash: text('password_hash').notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
	},
	(table) => {
		return {
			usersUsernameKey: unique('users_username_key').on(table.username),
			usersEmailKey: unique('users_email_key').on(table.email),
		}
	}
)

export const userfavoriteteams = pgTable(
	'userfavoriteteams',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint('id', { mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'userfavoriteteams_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036850000000,
				cache: 1,
			}),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		userId: bigint('user_id', { mode: 'number' }),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		teamId: bigint('team_id', { mode: 'number' }),
	},
	(table) => {
		return {
			userfavoriteteamsUserIdFkey: foreignKey({
				columns: [table.userId],
				foreignColumns: [users.id],
				name: 'userfavoriteteams_user_id_fkey',
			}),
			userfavoriteteamsTeamIdFkey: foreignKey({
				columns: [table.teamId],
				foreignColumns: [teams.id],
				name: 'userfavoriteteams_team_id_fkey',
			}),
		}
	}
)
