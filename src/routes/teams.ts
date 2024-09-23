import { Hono } from "hono";
import * as schema from "../../drizzle/schema";
import { asc, or, eq } from "drizzle-orm";

const teams = new Hono();

teams.get("/", async (c) => {
	const db = c.get("db");
	const result = await db.query.teams.findMany({
		with: {
			conference: true,
			games_awayTeamId: true,
			games_homeTeamId: true,
		},
		orderBy: [asc(schema.teams.name)],
	});

	const filteredResult = result.filter((team) => {
		return (
			team.conference.classification === "fbs" ||
			team.conference.classification === "fcs"
		);
	});
	return c.json(filteredResult);
});

teams.get("/:id", async (c) => {
	const db = c.get("db");
	const result = await db.query.teams.findFirst({
		where: (teams, { eq }) => eq(teams.id, Number.parseInt(c.req.param("id"))),
		with: {
			conference: true,
			games_awayTeamId: true,
			games_homeTeamId: true,
		},
	});
	return c.json(result);
});

teams.get("/name/:name", async (c) => {
	const db = c.get("db");
	const name = c.req.param("name");
	console.log(name);
	const result = await db.query.teams.findFirst({
		where: (teams, { eq }) => eq(teams.name, name),
		with: {
			conference: true,
			teamstats: {
				where: (teamstats, { eq }) => eq(teamstats.seasonId, 1), // Adjust the seasonId as needed
			},
		},
	});
	return c.json(result);
});

teams.put("/:id", async (c) => {
	const db = c.get("db");
	const body = await c.req.json();
	const result = await db
		.update(schema.teams)
		.set(body)
		.where(eq(schema.teams.id, Number.parseInt(c.req.param("id"))));
	return c.json(result);
});

teams.post("/new", async (c) => {
	const db = c.get("db");
	const body = await c.req.json();
	const result = await db.insert(schema.teams).values(body);
	return c.json(result);
});

teams.get("/conference/:slug", async (c) => {
	const db = c.get("db");
	const slug = c.req.param("slug");
	console.log(slug);
	const conference = await db.query.conferences.findFirst({
		where: (conferences, { eq }) => eq(conferences.abbreviation, slug),
	});

	const conferenceId = conference[0]?.id;
	console.log(conferenceId);

	const result = await db.query.teams.findMany({
		where: (teams, { eq }) => eq(teams.conferenceId, conferenceId),
	});
	return c.json(result);
});

teams.get("/newTeamsFromApi/hello", async (c) => {
	const db = c.get("db");
	try {
		console.log("Fetching teams from API");
		const apiTeams = await fetch("https://api.collegefootballdata.com/teams", {
			headers: {
				Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
			},
		});
		const teams = await apiTeams.json();

		// console.log('API response status:', apiTeams.status)
		// console.log('API response ok:', apiTeams.ok)

		const conferenceData = await db.query.conferences.findMany();
		console.log(conferenceData);

		for (const team of teams) {
			const conference = conferenceData.find(
				(conference) => conference.name === team.conference,
			);

			// console.log(conference)

			if (!conference) {
				console.log("Conference not found for team:", team.school);
				continue;
			}

			await db.insert(schema.teams).values({
				name: team.school,
				abbreviation: team.abbreviation,
				mascot: team.mascot,
				wins: 0,
				losses: 0,
				ties: 0,
				conferenceWins: 0,
				conferenceLosses: 0,
				conferenceTies: 0,
				gamesPlayed: 0,
				seasonId: 1,
				primaryColor: team.color,
				secondaryColor: team.alt_color,
				logo: team.logos ? team?.logos[0] : null,
				cfbApiId: team.id,
				conferenceId: conference.id,
				location: `${team.location.city}, ${team.location.state}`,
				division: team.classification,
			});
		}

		// console.log(teams)
		return c.json({ message: "Teams added" });
	} catch (error) {
		console.error("Error in newTeamsFromApi:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

teams.put("/updateTeamsFromApi/hello", async (c) => {
	const db = c.get("db");

	try {
		console.log("Fetching teams from API");
		const apiTeams = await fetch("https://api.collegefootballdata.com/teams", {
			headers: {
				Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
			},
		});
		const teams = await apiTeams.json();

		for (const team of teams) {
			await db
				.update(schema.teams)
				.set({
					division: team.classification,
					primaryColor: team.color,
					secondaryColor: team.alt_color,
					logo: team.logos ? team?.logos[0] : null,
				})
				.where(eq(schema.teams.cfbApiId, team.id));
		}

		return c.json({ message: "Teams updated" });
	} catch (error) {
		console.error("Error in updateTeamsFromApi:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

teams.get("/updateTeamStats/hello", async (c) => {
	const db = c.get("db");
	try {
		console.log("updating team stats");
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
			console.log(teamId[0].id);
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

		return c.json({ message: "Team stats updated" });
	} catch (error) {
		console.error("Error in updateTeamStats:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

teams.get("/updateRecords/hello", async (c) => {
	const db = c.get("db");
	try {
		console.log("getting records");
		const apiRecords = await fetch(
			"https://api.collegefootballdata.com/records?year=2024",
			{
				headers: {
					Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
				},
			},
		);
		const records = await apiRecords.json();

		// console.log(records)

		for (const record of records) {
			// console.log(record)
			await db
				.update(schema.teams)
				.set({
					wins: record.total.wins,
					losses: record.total.losses,
					ties: record.total.ties,
					conferenceWins: record.conferenceGames.wins,
					conferenceLosses: record.conferenceGames.losses,
					conferenceTies: record.conferenceGames.ties,
					gamesPlayed: record.total.games,
				})
				.where(eq(schema.teams.cfbApiId, record.teamId));
		}

		return c.json({ message: "Records updated" });
	} catch (error) {
		console.error("Error in updateRecords:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

teams.get("/updateRankings/hello", async (c) => {
	const db = c.get("db");
	try {
		console.log("getting rankings");
		const apiRankings = await fetch(
			"https://api.collegefootballdata.com/rankings?year=2024&seasonType=regular&week=4",
			{
				headers: {
					Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
				},
			},
		);

		const rankings = await apiRankings.json();

		// console.log(rankings)

		for (const poll of rankings[0].polls) {
			// console.log(poll.poll)
			for (const rank of poll.ranks) {
				// console.log(poll.poll)
				// console.log(rank)
				if (poll.poll === "AP Top 25") {
					await db
						.update(schema.teams)
						.set({
							apRank: rank.rank,
						})
						.where(eq(schema.teams.name, rank.school));
				} else if (poll.poll === "Coaches Poll") {
					await db
						.update(schema.teams)
						.set({
							coachesRank: rank.rank,
						})
						.where(eq(schema.teams.name, rank.school));
				} else if (poll.poll === "CFP Rankings") {
					await db
						.update(schema.teams)
						.set({
							cfpRank: rank.rank,
						})
						.where(eq(schema.teams.name, rank.school));
				} else if (poll.poll === "FCS Coaches Poll") {
					await db
						.update(schema.teams)
						.set({
							coachesRank: rank.rank,
						})
						.where(eq(schema.teams.name, rank.school));
				}
			}
		}

		return c.json({ message: "Rankings updated" });
	} catch (error) {
		console.error("Error in updateRankings:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

teams.get("/newGamesFromApi/hello", async (c) => {
	const db = c.get("db");
	try {
		console.log("Fetching games from API");
		const apiGames = await fetch(
			"https://api.collegefootballdata.com/games?year=2024&seasonType=regular&division=fbs",
			{
				headers: {
					Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
				},
			},
		);
		const games = await apiGames.json();

		console.log("API response status:", apiGames.status);
		console.log("API response ok:", apiGames.ok);

		for (const game of games) {
			let type = game.season_type;
			if (game.conference_game) {
				type = "conference";
			}

			const awayTeam = await db.query.teams.findFirst({
				where: (teams, { eq }) => eq(teams.cfbApiId, game.away_id),
			});
			const homeTeam = await db.query.teams.findFirst({
				where: (teams, { eq }) => eq(teams.cfbApiId, game.home_id),
			});

			if (!awayTeam || !homeTeam) {
				console.log("Team not found for game:", game);
				continue;
			}

			await db
				.insert(schema.games)
				.values({
					awayTeamId: game.away_id,
					homeTeamId: game.home_id,
					awayTeamName: game.away_team,
					homeTeamName: game.home_team,
					awayTeamScore: game.away_points,
					homeTeamScore: game.home_points,
					gameStart: game.start_date,
					seasonId: 1,
					week: game.week,
					type: type,
					cfbApiId: game.id,
					location: game.venue,
				})
				.onConflictDoNothing();
		}

		// console.log(teams)
		return c.json({ message: "Games added" });
	} catch (error) {
		console.error("Error in newTeamsFromApi:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

export default teams;
