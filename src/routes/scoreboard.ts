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

	console.log(homeTeam, awayTeam);

	try {
		const gameScoreboard = await db.query.scoreboard.findFirst({
			where: and(
				eq(schema.scoreboard.homeTeamId, homeTeam),
				eq(schema.scoreboard.awayTeamId, awayTeam),
			),
		});

		console.log(gameScoreboard);

		if (!gameScoreboard) {
			return c.json({ error: "Game not found" }, { status: 404 });
		}

		if (gameScoreboard?.status === "completed") {
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

			// Group stats by team using a reducer
			const groupedStats = teamStats.reduce((acc, stat) => {
				if (!acc[stat.team]) {
					acc[stat.team] = {};
				}
				acc[stat.team][stat.statName] = stat.statValue;
				return acc;
			}, {});

			// console.log(groupedStats)

			for (const team of Object.keys(groupedStats)) {
				// console.log(team)
				// console.log(groupedStats[team])
				const teamId = await db
					.select({ id: schema.teams.cfbApiId })
					.from(schema.teams)
					.where(eq(schema.teams.name, team));
				// console.log(teamId[0].id);
				await db
					.insert(schema.teamstats)
					.values({
						teamId: teamId[0].id,
						seasonId: 1,
						...groupedStats[team],
					})
					.onConflictDoUpdate({
						target: [schema.teamstats.teamId, schema.teamstats.seasonId],
						set: groupedStats[team],
					});
			}

			await db
				.update(schema.teams)
				.set({
					gamesPlayed: sql`${schema.teams.gamesPlayed} + 1`,
					gamesWon: sql`${schema.teams.wins} + ${gameScoreboard.homeTeamPoints > gameScoreboard.awayTeamPoints ? 1 : 0}`,
					gamesLost: sql`${schema.teams.losses} + ${gameScoreboard.homeTeamPoints < gameScoreboard.awayTeamPoints ? 1 : 0}`,
					gamesTied: sql`${schema.teams.ties} + ${gameScoreboard.homeTeamPoints === gameScoreboard.awayTeamPoints ? 1 : 0}`,
				})
				.where(eq(schema.teams.id, homeTeam));

			await db
				.update(schema.teams)
				.set({
					gamesPlayed: sql`${schema.teams.gamesPlayed} + 1`,
					gamesWon: sql`${schema.teams.wins} + ${gameScoreboard.homeTeamPoints < gameScoreboard.awayTeamPoints ? 1 : 0}`,
					gamesLost: sql`${schema.teams.losses} + ${gameScoreboard.homeTeamPoints > gameScoreboard.awayTeamPoints ? 1 : 0}`,
					gamesTied: sql`${schema.teams.ties} + ${gameScoreboard.homeTeamPoints === gameScoreboard.awayTeamPoints ? 1 : 0}`,
				})
				.where(eq(schema.teams.id, awayTeam));

			return c.json(gameScoreboard);
		}
		return c.json(gameScoreboard);
	} catch (error) {
		console.log(error);
	}
});

export default scoreboard;
