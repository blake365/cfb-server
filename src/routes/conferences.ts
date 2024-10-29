import { Hono } from "hono";
import * as schema from "../../drizzle/schema";
import { eq, desc, asc } from "drizzle-orm";

const conferences = new Hono();

conferences.get("/", async (c) => {
	const db = c.get("db");
	const result = await db.query.conferences.findMany({
		orderBy: (conferences, { asc }) => [
			asc(conferences.classification),
			asc(conferences.name),
		],
		with: { teams: true },
	});

	const filteredResult = result.filter(
		(conference) =>
			conference.teams.length > 0 &&
			(conference.classification === "fcs" ||
				conference.classification === "fbs"),
	);
	// console.log(filteredResult);
	return c.json(filteredResult);
});

conferences.get("/:slug", async (c) => {
	console.log("Fetching conference:", c.req.param("slug"));
	const db = c.get("db");
	const result = await db.query.conferences.findFirst({
		where: (conferences, { eq }) => eq(conferences.name, c.req.param("slug")),
		with: {
			teams: {
				orderBy: (teams, { desc }) => [desc(teams.conferenceWins)],
			},
		},
	});
	return c.json(result);
});

conferences.put("/:id", async (c) => {
	const db = c.get("db");
	const body = await c.req.json();
	const result = await db
		.update(schema.conferences)
		.set(body)
		.where(eq(schema.conferences.id, Number.parseInt(c.req.param("id"))));
	return c.json(result);
});

conferences.post("/", async (c) => {
	const db = c.get("db");
	const body = await c.req.json();
	const result = await db.insert(schema.conferences).values(body);
	return c.json(result);
});

// get games in a conference based on conference name
// conferences.get('/games/:name', async (c) => {
// 	const db = c.get('db')
// 	const name = c.req.param('name')
// 	const result = await db.query.games.findMany({
// 		where: (games, { eq }) => eq(games.conference, name),
// 	})
// 	return c.json(result)
// })

conferences.get("/newConferencesFromApi/hello", async (c) => {
	// console.log('Fetching conferences from API top line')
	const db = c.get("db");
	try {
		console.log("Fetching conferences from API");
		const apiConferences = await fetch(
			"https://api.collegefootballdata.com/conferences",
			{
				headers: {
					Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
				},
			},
		);
		console.log("API response status:", apiConferences.status);
		console.log("API response ok:", apiConferences.ok);

		if (!apiConferences.ok) {
			const errorText = await apiConferences.text();
			console.error("API error:", errorText);
			return c.json({ error: "API request failed" }, { status: 500 });
		}

		const conferences = await apiConferences.json();
		console.log("Conferences fetched:", conferences.length);
		// console.log(conferences)
		console.log("Adding conferences to database");
		for (const conference of conferences) {
			console.log(conference.name);
			await db.insert(schema.conferences).values({
				name: conference.name,
				cfbApiId: conference.id,
				fullName: conference.short_name,
				abbreviation: conference.abbreviation,
				classification: conference.classification,
			});
		}

		return c.json({ message: "Conferences added" });
	} catch (error) {
		console.error("Error in newConferencesFromApi:", error);
		return c.json({ error: error.message }, { status: 500 });
	}
});

export default conferences;
