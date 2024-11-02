// routes for interacting with games

import { Hono } from "hono";
import * as schema from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCookie, setCookie } from "hono/cookie";

const interactions = new Hono();

function generateUserId() {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

interactions.post("/:gameId", async (c) => {
	// console.log("interactions.post");
	const db = c.get("db");
	const gameId = Number(c.req.param("gameId"));
	// console.log('gameId', gameId)
	const { interactionType } = await c.req.json();

	let userId = getCookie(c, "userId");

	// console.log("userId", userId);

	if (!userId) {
		userId = generateUserId();
		setCookie(c, "userId", userId, {
			secure: true,
			domain: Bun.env.NODE_ENV === "production" ? ".cfbsickos.com" : "",
			sameSite: "strict",
			httpOnly: true,
			maxAge: 60 * 60,
		});
	}

	// console.log("userId", userId);

	const recentInteractions = await db
		.select()
		.from(schema.interactions)
		.where(
			and(
				eq(schema.interactions.userId, userId.toString()),
				eq(schema.interactions.gameId, gameId),
				eq(schema.interactions.interactionType, interactionType),
			),
		)
		.orderBy(desc(schema.interactions.createdAt))
		.limit(1);

	// console.log('recentInteractions', recentInteractions)

	if (recentInteractions.length >= 1) {
		const mostRecentInteraction = recentInteractions[0];
		const interactionTime = new Date(mostRecentInteraction.createdAt);
		const timeDifference = Date.now() - interactionTime.getTime();
		const minutesSinceLastInteraction = timeDifference / (1000 * 60);

		if (minutesSinceLastInteraction < 10) {
			return c.json(
				{
					error: "Rate limit exceeded",
					minutesRemaining: 10 - minutesSinceLastInteraction,
				},
				429,
			);
		}
	}

	try {
		const result = await db.insert(schema.interactions).values({
			gameId,
			interactionType: interactionType,
			userId,
		});

		console.log("next update interest score");
		try {
			const response = await fetch(
				`${Bun.env.SERVER_URL}/games/updateInterestScore/${gameId}`,
			);
			if (!response.ok) {
				console.error(
					`Failed to update interest score: ${response.status} ${response.statusText}`,
				);
			}
		} catch (fetchError) {
			console.error("Error updating interest score:", fetchError);
		}

		return c.json(result);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

export default interactions;
