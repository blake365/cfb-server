import { relations } from "drizzle-orm/relations";
import { teams, players, coaches, locations, stadiums, seasons, conferences, teamstats, games, gamestats, users, userfavoriteteams } from "./schema";

export const playersRelations = relations(players, ({one}) => ({
	team: one(teams, {
		fields: [players.teamId],
		references: [teams.id]
	}),
}));

export const teamsRelations = relations(teams, ({one, many}) => ({
	players: many(players),
	coaches: many(coaches),
	season: one(seasons, {
		fields: [teams.seasonId],
		references: [seasons.id]
	}),
	conference: one(conferences, {
		fields: [teams.conferenceId],
		references: [conferences.id]
	}),
	stadium: one(stadiums, {
		fields: [teams.stadiumId],
		references: [stadiums.id]
	}),
	teamstats: many(teamstats),
	gamestats: many(gamestats),
	games_homeTeamId: many(games, {
		relationName: "games_homeTeamId_teams_id"
	}),
	games_awayTeamId: many(games, {
		relationName: "games_awayTeamId_teams_id"
	}),
	games_winnerId: many(games, {
		relationName: "games_winnerId_teams_id"
	}),
	userfavoriteteams: many(userfavoriteteams),
}));

export const coachesRelations = relations(coaches, ({one}) => ({
	team: one(teams, {
		fields: [coaches.teamId],
		references: [teams.id]
	}),
}));

export const stadiumsRelations = relations(stadiums, ({one, many}) => ({
	location: one(locations, {
		fields: [stadiums.locationId],
		references: [locations.id]
	}),
	teams: many(teams),
	games: many(games),
}));

export const locationsRelations = relations(locations, ({many}) => ({
	stadiums: many(stadiums),
}));

export const seasonsRelations = relations(seasons, ({many}) => ({
	teams: many(teams),
	teamstats: many(teamstats),
	games: many(games),
}));

export const conferencesRelations = relations(conferences, ({many}) => ({
	teams: many(teams),
}));

export const teamstatsRelations = relations(teamstats, ({one}) => ({
	team: one(teams, {
		fields: [teamstats.teamId],
		references: [teams.id]
	}),
	season: one(seasons, {
		fields: [teamstats.seasonId],
		references: [seasons.id]
	}),
}));

export const gamestatsRelations = relations(gamestats, ({one}) => ({
	game: one(games, {
		fields: [gamestats.gameId],
		references: [games.id]
	}),
	team: one(teams, {
		fields: [gamestats.teamId],
		references: [teams.id]
	}),
}));

export const gamesRelations = relations(games, ({one, many}) => ({
	gamestats: many(gamestats),
	team_homeTeamId: one(teams, {
		fields: [games.homeTeamId],
		references: [teams.id],
		relationName: "games_homeTeamId_teams_id"
	}),
	team_awayTeamId: one(teams, {
		fields: [games.awayTeamId],
		references: [teams.id],
		relationName: "games_awayTeamId_teams_id"
	}),
	stadium: one(stadiums, {
		fields: [games.stadiumId],
		references: [stadiums.id]
	}),
	season: one(seasons, {
		fields: [games.seasonId],
		references: [seasons.id]
	}),
	team_winnerId: one(teams, {
		fields: [games.winnerId],
		references: [teams.id],
		relationName: "games_winnerId_teams_id"
	}),
}));

export const userfavoriteteamsRelations = relations(userfavoriteteams, ({one}) => ({
	user: one(users, {
		fields: [userfavoriteteams.userId],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [userfavoriteteams.teamId],
		references: [teams.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userfavoriteteams: many(userfavoriteteams),
}));