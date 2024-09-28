import { Hono } from "hono";
import * as schema from "../../drizzle/schema";
import { asc, eq, gt, count, desc, or, sql, and } from "drizzle-orm";
import { calculateGameInterest } from "../functions/interestScore";

const games = new Hono();

games.get("/", async (c) => {
	const db = c.get("db");
	try {
		const result = await db.query.games.findMany({
			with: {
				team_homeTeamId: true,
				team_awayTeamId: true,
				interactions: true,
			},
			orderBy: (games, { desc }) => [desc(games.interestScore)],
			limit: 10,
		});
		// console.log(result)
		return c.json(result);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

games.get("/:id", async (c) => {
	const db = c.get("db");
	const result = await db.query.games.findFirst({
		where: (games, { eq }) => eq(games.id, Number.parseInt(c.req.param("id"))),
		with: {
			team_homeTeamId: true,
			team_awayTeamId: true,
			interactions: true,
		},
	});
	return c.json(result);
});

games.put("/:id", async (c) => {
	const db = c.get("db");
	const body = await c.req.json();
	const result = await db
		.update(schema.games)
		.set(body)
		.where(eq(schema.games.id, Number.parseInt(c.req.param("id"))));
	return c.json(result);
});

// games.delete("/:id", async (c) => {
// 	const db = c.get("db");
// 	const result = await db
// 		.delete(schema.games)
// 		.where(eq(schema.games.id, Number.parseInt(c.req.param("id"))));
// 	return c.json(result);
// });

// games.post('/:id/interactions', async (c) => {
// 	const db = c.get('db')
// 	const body = await c.req.json()
// 	const result = await db
// 		.insert(schema.interactions)
// 		.values(body)
// 		.where(eq(schema.games.id, Number.parseInt(c.req.param('id'))))
// 	return c.json(result)
// })

games.get("/:id/interactions", async (c) => {
	// console.log('getting interactions', c.req.param('id'))
	const db = c.get("db");
	const result = await db.query.interactions.findMany({
		where: (interactions, { eq }) =>
			eq(interactions.gameId, Number.parseInt(c.req.param("id"))),
	});
	// console.log('result', result)
	return c.json(result);
});

games.post("/new", async (c) => {
	const db = c.get("db");
	const body = await c.req.json();
	const result = await db.insert(schema.games).values(body);
	return c.json(result);
});

games.get("/current", async (c) => {
	// get games happening in the current week ending on sunday
	const currentDate = new Date();
	const currentDayOfWeek = currentDate.getDay();
	const sundayDate = new Date(currentDate);
	sundayDate.setDate(currentDate.getDate() + (6 - currentDayOfWeek));
	const startOfWeek = sundayDate;
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 6);

	const db = c.get("db");
	const result = await db.query.games.findMany({
		where: (games, { gte, lte }) =>
			gte(games.date, startOfWeek) && lte(games.date, endOfWeek),
		with: {
			team_homeTeamId: true,
			team_awayTeamId: true,
			interactions: true,
		},
	});

	return c.json(result);
});

games.get("/week/:week", async (c) => {
	const week = Number.parseInt(c.req.param("week"));
	const db = c.get("db");
	const result = await db.query.games.findMany({
		where: (games, { eq }) => eq(games.week, week),
		with: {
			team_homeTeamId: true,
			team_awayTeamId: true,
			interactions: true,
		},
		orderBy: (games, { desc }) => [desc(games.interestScore)],
	});

	const filteredResults = result.filter((game) => {
		// console.log(game.team_homeTeamId.division, game.team_awayTeamId.division);

		if (
			// if neither team is fbs, return false
			game.team_homeTeamId.division !== "fbs" &&
			game.team_awayTeamId.division !== "fbs"
		) {
			return false;
		}

		return true;
	});

	return c.json(filteredResults);
});

games.get("/team/:slug", async (c) => {
	const slug = c.req.param("slug");
	console.log("slug", slug);
	const db = c.get("db");

	try {
		const id = await db
			.select()
			.from(schema.teams)
			.where(eq(schema.teams.name, slug));

		console.log("id", id[0].id);

		const result = await db.query.games.findMany({
			where: (games, { eq }) =>
				or(
					eq(games.homeTeamId, id[0].cfbApiId),
					eq(games.awayTeamId, id[0].cfbApiId),
				),
			with: {
				team_homeTeamId: true,
				team_awayTeamId: true,
				interactions: true,
			},
			orderBy: [asc(schema.games.gameStart)],
		});

		// console.log(typeof result)
		// console.log('result', result)
		return c.json(result);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

games.get("/conference/:slug/:week", async (c) => {
	const slug = c.req.param("slug");
	const week = Number.parseInt(c.req.param("week"));
	const db = c.get("db");

	try {
		const id = await db
			.select()
			.from(schema.conferences)
			.where(eq(schema.conferences.name, slug));

		console.log("id", id[0].id);
		console.log("slug", slug);

		const teams = await db.query.teams.findMany({
			where: (teams, { eq }) => eq(teams.conferenceId, id[0].id),
		});

		// console.log('teams', teams)

		let result = [];

		for (const team of teams) {
			console.log("team", team.name);

			const teamGames = await db.query.games.findMany({
				where: (games, { eq, and, or }) =>
					or(
						eq(games.homeTeamId, team.cfbApiId),
						eq(games.awayTeamId, team.cfbApiId),
					),
				with: {
					team_homeTeamId: true,
					team_awayTeamId: true,
					interactions: true,
				},
				orderBy: [desc(schema.games.gameStart)],
			});

			const filteredGames = teamGames.filter((game) => game.week === week);

			// don't add a game if undefined
			if (!teamGames) {
				continue;
			}

			// if the game is already in the result, skip it
			if (
				result.some((game) => game?.cfbApiId === filteredGames[0]?.cfbApiId)
			) {
				continue;
			}

			result.push(filteredGames[0]);
		}

		// console.log('result', result)

		result = result.filter((game) => game);

		return c.json(result);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

games.get("/getBettingLines/hello", async (c) => {
	const db = c.get("db");
	try {
		console.log("getting betting lines");
		const apiBettingLines = await fetch(
			"https://api.collegefootballdata.com/lines?year=2024",
			{
				headers: {
					Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
				},
			},
		);
		const bettingLines = await apiBettingLines.json();
		// console.log('betting lines', bettingLines)

		const filteredBettingLines = bettingLines.filter(
			(game) => game.lines.length > 0,
		);

		for (const game of filteredBettingLines) {
			// console.log('game', game)

			const bettingLine = game.lines[game.lines.length - 1];

			await db
				.update(schema.games)
				.set({
					spread: bettingLine.formattedSpread,
					overUnder: bettingLine?.overUnder?.toString() || null,
					bettingSource: bettingLine.provider,
				})
				.where(
					and(
						eq(schema.games.week, game.week),
						eq(schema.games.homeTeamName, game.homeTeam),
						eq(schema.games.awayTeamName, game.awayTeam),
					),
				);
		}

		return c.json({ message: "updated betting lines" });
	} catch (error) {
		console.error("Error getting betting lines:", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

games.get("/getMediaInformation/hello", async (c) => {
	const db = c.get("db");
	try {
		console.log("getting media");
		const apiMedia = await fetch(
			"https://api.collegefootballdata.com/games/media?year=2024",
			{
				headers: {
					Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
				},
			},
		);
		const media = await apiMedia.json();
		// console.log('media', media)

		const sortedMedia = media.sort((a, b) => {
			// if mediaType is web, put it first
			if (a.mediaType === "web") {
				return -1;
			}
			if (b.mediaType === "web") {
				return 1;
			}
			return 0;
		});

		for (const game of sortedMedia) {
			console.log("game", game);
			await db
				.update(schema.games)
				.set({ tvNetwork: game.outlet, mediaType: game.mediaType })
				.where(
					and(
						eq(schema.games.week, game.week),
						eq(schema.games.homeTeamName, game.homeTeam),
						eq(schema.games.awayTeamName, game.awayTeam),
					),
				);
		}
		return c.json({ message: "media added to games" });
	} catch (error) {
		console.error("Error getting media:", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

games.get("/work/deleteDuplicateGames", async (c) => {
	const db = c.get("db");

	try {
		// Find duplicate games based on cfbApiId
		const duplicateGames = await db
			.select({
				cfbApiId: schema.games.cfbApiId,
				count: sql`count(*)`.as("count"),
			})
			.from(schema.games)
			.groupBy(schema.games.cfbApiId)
			.having(sql`count(*) > 1`)
			.execute();

		console.log("Duplicate games:", duplicateGames);

		// Delete duplicate games, keeping only one for each cfbApiId
		for (const game of duplicateGames) {
			const gamesWithSameId = await db
				.select()
				.from(schema.games)
				.where(eq(schema.games.cfbApiId, game.cfbApiId))
				.orderBy(asc(schema.games.id))
				.execute();

			// Keep the first game (with the lowest id) and delete the rest
			for (let i = 1; i < gamesWithSameId.length; i++) {
				await db
					.delete(schema.games)
					.where(eq(schema.games.id, gamesWithSameId[i].id))
					.execute();
			}
		}

		console.log("Duplicate games deleted");

		return c.json({ message: "Duplicate games deleted" });
	} catch (error) {
		console.error("Error deleting duplicate games:", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

games.get("/updateInterestScore/:id", async (c) => {
	console.log("updating interest score");
	const db = c.get("db");
	const id = Number.parseInt(c.req.param("id"));
	try {
		const game = await db.query.games.findFirst({
			where: (games, { eq }) => eq(games.id, id),
			with: {
				team_homeTeamId: true,
				team_awayTeamId: true,
				interactions: true,
			},
		});
		// console.log("prev interestScore", game?.interestScore);
		const interestScore = calculateGameInterest(game);
		// console.log("interestScore", interestScore);
		await db
			.update(schema.games)
			.set({ interestScore })
			.where(eq(schema.games.id, id));

		// console.log("Interest score updated");
		return c.json({ message: "Interest score updated" });
	} catch (error) {
		console.error("Error updating interest score:", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});
export default games;
