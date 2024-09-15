// routes for interacting with games

import { Hono } from 'hono'
import * as schema from '../../drizzle/schema'
import { asc, eq, gte, lte, and, desc } from 'drizzle-orm'

const interactions = new Hono()

// Function to generate a userId from IP address
function generateUserId(ip: string) {
	return Number.parseInt(Bun.hash(ip).toString().slice(0, 16))
}

interactions.post('/:gameId', async (c) => {
	console.log('interactions.post')
	const db = c.get('db')
	const gameId = Number(c.req.param('gameId'))
	console.log('gameId', gameId)
	const { interactionType } = await c.req.json()
	const ip = c.req.header('x-forwarded-for')
	const userId = generateUserId(ip)
	console.log('userId', userId)
	// console.log('createdAt', schema.interactions.createdAt)

	const recentInteractions = await db
		.select()
		.from(schema.interactions)
		.where(
			and(
				eq(schema.interactions.userId, userId),
				eq(schema.interactions.gameId, gameId),
				eq(schema.interactions.interactionType, interactionType)
			)
		)
		.orderBy(desc(schema.interactions.createdAt))
		.limit(1)

	console.log('recentInteractions', recentInteractions)

	if (recentInteractions.length >= 1) {
		const mostRecentInteraction = recentInteractions[0]
		const interactionTime = new Date(mostRecentInteraction.createdAt)
		const timeDifference = Date.now() - interactionTime.getTime()
		const minutesSinceLastInteraction = timeDifference / (1000 * 60)

		if (minutesSinceLastInteraction < 10) {
			return c.json(
				{
					error: 'Rate limit exceeded',
					minutesRemaining: 10 - minutesSinceLastInteraction,
				},
				429
			)
		}
	}

	try {
		const result = await db.insert(schema.interactions).values({
			gameId,
			interactionType: interactionType,
			userId,
		})
		return c.json(result)
	} catch (error) {
		console.error(error)
		return c.json({ error: 'Internal Server Error' }, 500)
	}
})

export default interactions
