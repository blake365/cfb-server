import { Hono } from "hono";
import * as schema from "../../drizzle/schema";
import { asc, or, eq, and, sql } from "drizzle-orm";

const scoreboard = new Hono();

scoreboard.get("/fillScoreboard", async (c) => {
	const db = c.get("db");

	try {
		console.log("updating scoreboard data");
		const scoreboardGamesApi = await fetch(
			"https://apinext.collegefootballdata.com/scoreboard",
			{
				headers: {
					Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
				},
			},
		);
		const scoreboardGames = await scoreboardGamesApi.json();

		for (const game of scoreboardGames) {
			// console.log(game)
			await db
				.insert(schema.scoreboard)
				.values({
					cfbApiId: game.id,
					startDate: game.startDate,
					status: game.status,
					period: game.period,
					clock: game.clock,
					possession: game.possession,
					lastPlay: game.lastPlay,
					homeTeamId: game.homeTeam.id,
					homeTeamName: game.homeTeam.name,
					homeTeamPoints: game.homeTeam.points,
					awayTeamId: game.awayTeam.id,
					awayTeamName: game.awayTeam.name,
					awayTeamPoints: game.awayTeam.points,
					temperature: game.weather.temperature,
					weather: game.weather.description,
				})
				.onConflictDoUpdate({
					target: schema.scoreboard.cfbApiId,
					set: {
						cfpApiId: game.id,
						startDate: game.startDate,
						status: game.status,
						period: game.period,
						clock: game.clock,
						possession: game.possession,
						lastPlay: game.lastPlay,
						homeTeamId: game.homeTeam.id,
						homeTeamName: game.homeTeam.name,
						homeTeamPoints: game.homeTeam.points,
						awayTeamId: game.awayTeam.id,
						awayTeamName: game.awayTeam.name,
						awayTeamPoints: game.awayTeam.points,
						temperature: game.weather.temperature,
						weather: game.weather.description,
					},
				});
		}

		return c.json({ message: "scoreboard data added/updated" });
	} catch (error) {
		console.error("Error in updateRankings:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

scoreboard.post("/scoreboard/hello", async (c) => {
	const db = c.get("db");
	const { homeTeam, awayTeam } = await c.req.json();

	// console.log(homeTeam, awayTeam);

	try {
		const gameScoreboard = await db.query.scoreboard.findFirst({
			where: and(
				eq(schema.scoreboard.homeTeamId, homeTeam),
				eq(schema.scoreboard.awayTeamId, awayTeam),
			),
		});

		// console.log(gameScoreboard);

		if (!gameScoreboard) {
			console.log("game scoreboard not found");
			return c.json({ error: "Game not found" }, { status: 404 });
		}

		if (gameScoreboard?.status === "completed") {
			console.log("handling game completion");

			try {
				await db
					.update(schema.games)
					.set({
						gameCompleted: true,
						homeTeamScore: gameScoreboard.homeTeamPoints,
						awayTeamScore: gameScoreboard.awayTeamPoints,
					})
					.where(
						and(
							eq(schema.games.homeTeamId, homeTeam),
							eq(schema.games.awayTeamId, awayTeam),
						),
					);
			} catch (error) {
				console.log("error updating game final score", error);
			}

			try {
				const apiTeamStats = await fetch(
					"https://api.collegefootballdata.com/stats/season?year=2024",
					{
						headers: {
							Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
						},
					},
				);

				const teamStats = await apiTeamStats.json();
				// console.log(teamStats)
			} catch (error) {
				console.log("error fetching team stats", error);
			}

			const groupedStats = teamStats.reduce((acc, stat) => {
				if (!acc[stat.team]) {
					acc[stat.team] = { teamName: stat.team, seasonId: 1 };
				}
				acc[stat.team][stat.statName] = stat.statValue;
				return acc;
			}, {});

			// console.log(groupedStats)
			const upsertData = Object.values(groupedStats);

			try {
				// console.log(teamId[0].id);
				await db
					.insert(schema.teamstats)
					.values(upsertData)
					.onConflictDoUpdate({
						target: [schema.teamstats.teamName],
						set: {
							seasonId: sql`EXCLUDED.season_id`,
							completionAttempts: sql`EXCLUDED.completion_attempts`,
							defensiveTDs: sql`EXCLUDED.defensive_tds`,
							extraPoints: sql`EXCLUDED.extra_points`,
							fieldGoalPct: sql`EXCLUDED.field_goal_pct`,
							fieldGoals: sql`EXCLUDED.field_goals`,
							firstDowns: sql`EXCLUDED.first_downs`,
							fourthDownEff: sql`EXCLUDED.fourth_down_eff`,
							fumblesLost: sql`EXCLUDED.fumbles_lost`,
							fumblesRecovered: sql`EXCLUDED.fumbles_recovered`,
							interceptions: sql`EXCLUDED.interceptions`,
							interceptionTDs: sql`EXCLUDED.interception_tds`,
							interceptionYards: sql`EXCLUDED.interception_yards`,
							kickingPoints: sql`EXCLUDED.kicking_points`,
							kickReturns: sql`EXCLUDED.kick_returns`,
							kickReturnTDs: sql`EXCLUDED.kick_return_tds`,
							kickReturnYards: sql`EXCLUDED.kick_return_yards`,
							netPassingYards: sql`EXCLUDED.net_passing_yards`,
							passesDeflected: sql`EXCLUDED.passes_deflected`,
							passesIntercepted: sql`EXCLUDED.passes_intercepted`,
							passingTDs: sql`EXCLUDED.passing_tds`,
							possessionTime: sql`EXCLUDED.possession_time`,
							puntReturns: sql`EXCLUDED.punt_returns`,
							puntReturnTDs: sql`EXCLUDED.punt_return_tds`,
							puntReturnYards: sql`EXCLUDED.punt_return_yards`,
							qbHurries: sql`EXCLUDED.qb_hurries`,
							rushingAttempts: sql`EXCLUDED.rushing_attempts`,
							rushingTDs: sql`EXCLUDED.rushing_tds`,
							rushingYards: sql`EXCLUDED.rushing_yards`,
							sacks: sql`EXCLUDED.sacks`,
							tackles: sql`EXCLUDED.tackles`,
							tacklesForLoss: sql`EXCLUDED.tackles_for_loss`,
							thirdDownEff: sql`EXCLUDED.third_down_eff`,
							totalFumbles: sql`EXCLUDED.total_fumbles`,
							totalPenaltiesYards: sql`EXCLUDED.total_penalties_yards`,
							totalYards: sql`EXCLUDED.total_yards`,
							turnovers: sql`EXCLUDED.turnovers`,
							yardsPerPass: sql`EXCLUDED.yards_per_pass`,
							yardsPerRushAttempt: sql`EXCLUDED.yards_per_rush_attempt`,
						},
					});
			} catch (error) {
				console.log("error updating team stats", error);
			}

			try {
				await db
					.update(schema.teams)
					.set({
						gamesPlayed: sql`${schema.teams.gamesPlayed} + 1`,
						gamesWon: sql`${schema.teams.wins} + ${gameScoreboard.homeTeamPoints > gameScoreboard.awayTeamPoints ? 1 : 0}`,
						gamesLost: sql`${schema.teams.losses} + ${gameScoreboard.homeTeamPoints < gameScoreboard.awayTeamPoints ? 1 : 0}`,
						gamesTied: sql`${schema.teams.ties} + ${gameScoreboard.homeTeamPoints === gameScoreboard.awayTeamPoints ? 1 : 0}`,
					})
					.where(eq(schema.teams.id, homeTeam));
			} catch (error) {
				console.log("error updating home team stats", error);
			}

			try {
				await db
					.update(schema.teams)
					.set({
						gamesPlayed: sql`${schema.teams.gamesPlayed} + 1`,
						gamesWon: sql`${schema.teams.wins} + ${gameScoreboard.homeTeamPoints < gameScoreboard.awayTeamPoints ? 1 : 0}`,
						gamesLost: sql`${schema.teams.losses} + ${gameScoreboard.homeTeamPoints > gameScoreboard.awayTeamPoints ? 1 : 0}`,
						gamesTied: sql`${schema.teams.ties} + ${gameScoreboard.homeTeamPoints === gameScoreboard.awayTeamPoints ? 1 : 0}`,
					})
					.where(eq(schema.teams.id, awayTeam));
			} catch (error) {
				console.log("error updating away team stats", error);
			}

			return c.json(gameScoreboard);
		}

		return c.json(gameScoreboard);
	} catch (error) {
		console.log(error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

export default scoreboard;
