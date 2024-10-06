import { Hono } from "hono";
import * as schema from "../../drizzle/schema";
import { asc, or, eq, sql } from "drizzle-orm";
import weeks from "../../lib/weeks";
import { collegeFootballRivalries } from "../../lib/cfb-rivalries-json-3";

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
	// console.log(slug);
	const conference = await db.query.conferences.findFirst({
		where: (conferences, { eq }) => eq(conferences.abbreviation, slug),
		with: {
			teams: true,
		},
	});

	return c.json(conference?.teams);
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

		const conferenceData = await db.query.conferences.findMany();

		const teamsToInsert = teams.reduce((acc, team) => {
			const conference = conferenceData.find(
				(conference) => conference.name === team.conference,
			);

			if (!conference) {
				console.log("Conference not found for team:", team.school);
				return acc;
			}

			acc.push({
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

			return acc;
		}, []);

		if (teamsToInsert.length > 0) {
			await db.insert(schema.teams).values(teamsToInsert);
		}

		return c.json({ message: `${teamsToInsert.length} teams added` });
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
				acc[stat.team] = { teamName: stat.team, seasonId: 1 };
			}
			acc[stat.team][stat.statName] = stat.statValue;
			return acc;
		}, {});

		// console.log(groupedStats)
		const upsertData = Object.values(groupedStats);
		console.log(upsertData);

		// Perform bulk upsert
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
		const teamRecords = await apiRecords.json();

		// Prepare bulk update data
		const updateData = teamRecords.map((team) => ({
			name: team.team,
			wins: team.total.wins,
			losses: team.total.losses,
			ties: team.total.ties,
			conferenceWins: team.conferenceGames.wins,
			conferenceLosses: team.conferenceGames.losses,
			conferenceTies: team.conferenceGames.ties,
			gamesPlayed: team.total.games,
		}));

		// Perform bulk update
		if (updateData.length > 0) {
			await db.transaction(async (tx) => {
				for (const data of updateData) {
					await tx
						.update(schema.teams)
						.set({
							wins: data.wins,
							losses: data.losses,
							ties: data.ties,
							conferenceWins: data.conferenceWins,
							conferenceLosses: data.conferenceLosses,
							conferenceTies: data.conferenceTies,
							gamesPlayed: data.gamesPlayed,
						})
						.where(eq(schema.teams.name, data.name));
				}
			});
		}

		return c.json({ message: `${updateData.length} team records updated` });
	} catch (error) {
		console.error("Error in updateRecords:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

teams.get("/updateRankings/hello", async (c) => {
	const db = c.get("db");

	const now = new Date().getTime();
	const currentWeek = weeks.find((week) => {
		return now >= week.startDate.getTime() && now <= week.endDate.getTime();
	});

	try {
		console.log("getting rankings");
		const apiRankings = await fetch(
			`https://api.collegefootballdata.com/rankings?year=2024&seasonType=regular&week=${currentWeek.week}`,
			{
				headers: {
					Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
				},
			},
		);

		const rankings = await apiRankings.json();

		// console.log(rankings)

		// remove all old rankings
		await db.update(schema.teams).set({
			apRank: null,
			coachesRank: null,
			cfpRank: null,
		});

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
				} else if (poll.poll === "Playoff Committee Rankings") {
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
					gameCompleted: game.completed,
				})
				.onConflictDoUpdate({
					target: [schema.games.cfbApiId],
					set: {
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
						gameCompleted: game.completed,
					},
				});
		}

		// console.log(teams)
		return c.json({ message: "Games added" });
	} catch (error) {
		console.error("Error in newTeamsFromApi:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

teams.get("/updateRivalries/hello", async (c) => {
	const db = c.get("db");
	try {
		console.log("Updating rivalries");
		const rivalries = collegeFootballRivalries;
		// console.log(rivalries);

		for (const [key, value] of Object.entries(rivalries)) {
			console.log(key, value);

			// get the team based on the key
			await db
				.update(schema.teams)
				.set({
					rivals: value,
				})
				.where(eq(schema.teams.name, key));
		}

		return c.json({ message: "Rivalries updated" });
	} catch (error) {
		console.error("Error in updateRivalries:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

export default teams;
