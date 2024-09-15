// routes to be run on a schedule
import { Hono } from 'hono'
import * as schema from '../../drizzle/schema'
import { asc, eq, gte, lte } from 'drizzle-orm'
import calculateInterestScore from '../functions/interestScore'

const cron = new Hono()

cron.get('/updateInterestScores', async (c) => {
	const db = c.get('db')
	try {
		// Fetch all games with their related teams and interactions
		const allGames = await db.query.games.findMany({
			with: {
				team_homeTeamId: true,
				team_awayTeamId: true,
				interactions: true,
			},
		})

		// Calculate and update interest scores for each game
		for (const game of allGames) {
			const interestScore = calculateInterestScore(game)

			// Update the game's interestScore in the database
			await db
				.update(schema.games)
				.set({ interestScore })
				.where(eq(schema.games.id, game.id))
		}

		return c.json(
			{ message: 'Games analyzed and interest scores updated successfully' },
			200
		)
	} catch (error) {
		console.error(error)
		return c.json({ error: 'Internal Server Error' }, 500)
	}
})

export default cron
