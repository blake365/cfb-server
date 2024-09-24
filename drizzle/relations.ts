import { relations } from "drizzle-orm/relations";
import {
	teams,
	seasons,
	conferences,
	teamstats,
	games,
	gamestats,
	interactions,
} from "./schema";

export const teamsRelations = relations(teams, ({ one, many }) => ({
	season: one(seasons, {
		fields: [teams.seasonId],
		references: [seasons.id],
	}),
	conference: one(conferences, {
		fields: [teams.conferenceId],
		references: [conferences.id],
	}),
	teamstats: one(teamstats, {
		fields: [teams.name],
		references: [teamstats.teamName],
	}),
	gamestats: many(gamestats),
	games_homeTeamId: many(games, {
		relationName: "games_homeTeamId_teams_id",
	}),
	games_awayTeamId: many(games, {
		relationName: "games_awayTeamId_teams_id",
	}),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
	teams: many(teams),
	teamstats: many(teamstats),
	games: many(games),
}));

export const conferencesRelations = relations(conferences, ({ many }) => ({
	teams: many(teams),
}));

export const teamstatsRelations = relations(teamstats, ({ one }) => ({
	team: one(teams, {
		fields: [teamstats.teamName],
		references: [teams.name],
	}),
	season: one(seasons, {
		fields: [teamstats.seasonId],
		references: [seasons.id],
	}),
}));

export const gamestatsRelations = relations(gamestats, ({ one }) => ({
	game: one(games, {
		fields: [gamestats.gameId],
		references: [games.id],
	}),
	team: one(teams, {
		fields: [gamestats.teamId],
		references: [teams.id],
	}),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
	gamestats: many(gamestats),
	team_homeTeamId: one(teams, {
		fields: [games.homeTeamId],
		references: [teams.cfbApiId],
		relationName: "games_homeTeamId_teams_id",
	}),
	team_awayTeamId: one(teams, {
		fields: [games.awayTeamId],
		references: [teams.cfbApiId],
		relationName: "games_awayTeamId_teams_id",
	}),
	season: one(seasons, {
		fields: [games.seasonId],
		references: [seasons.id],
	}),
	interactions: many(interactions),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
	game: one(games, {
		fields: [interactions.gameId],
		references: [games.id],
	}),
}));
