import { Hono } from 'hono'
import * as schema from '../../drizzle/schema'
import { asc, eq, gte, lte } from 'drizzle-orm'

const games = new Hono()

games.get('/', async (c) => {
	const db = c.get('db')
	try {
		const result = await db.query.games.findMany({
			with: {
				team_homeTeamId: true,
				team_awayTeamId: true,
				interactions: true,
			},
		})
		// console.log(result)
		return c.json(result)
	} catch (error) {
		console.error(error)
		return c.json({ error: 'Internal Server Error' }, 500)
	}
})

games.get('/:id', async (c) => {
	const db = c.get('db')
	const result = await db.query.games.findFirst({
		where: (games, { eq }) => eq(games.id, Number.parseInt(c.req.param('id'))),
		with: {
			team_homeTeamId: true,
			team_awayTeamId: true,
			interactions: true,
		},
	})
	return c.json(result)
})

games.put('/:id', async (c) => {
	const db = c.get('db')
	const body = await c.req.json()
	const result = await db
		.update(schema.games)
		.set(body)
		.where(eq(schema.games.id, Number.parseInt(c.req.param('id'))))
	return c.json(result)
})

games.delete('/:id', async (c) => {
	const db = c.get('db')
	const result = await db
		.delete(schema.games)
		.where(eq(schema.games.id, Number.parseInt(c.req.param('id'))))
	return c.json(result)
})

// games.post('/:id/interactions', async (c) => {
// 	const db = c.get('db')
// 	const body = await c.req.json()
// 	const result = await db
// 		.insert(schema.interactions)
// 		.values(body)
// 		.where(eq(schema.games.id, Number.parseInt(c.req.param('id'))))
// 	return c.json(result)
// })

games.get('/:id/interactions', async (c) => {
	console.log('getting interactions', c.req.param('id'))
	const db = c.get('db')
	const result = await db.query.interactions.findMany({
		where: (interactions, { eq }) =>
			eq(interactions.gameId, Number.parseInt(c.req.param('id'))),
	})
	console.log('result', result)
	return c.json(result)
})

games.post('/new', async (c) => {
	const db = c.get('db')
	const body = await c.req.json()
	const result = await db.insert(schema.games).values(body)
	return c.json(result)
})

games.get('/current', async (c) => {
	// get games happening in the current week ending on sunday
	const currentDate = new Date()
	const currentDayOfWeek = currentDate.getDay()
	const sundayDate = new Date(currentDate)
	sundayDate.setDate(currentDate.getDate() + (6 - currentDayOfWeek))
	const startOfWeek = sundayDate
	const endOfWeek = new Date(startOfWeek)
	endOfWeek.setDate(startOfWeek.getDate() + 6)

	const db = c.get('db')
	const result = await db.query.games.findMany({
		where: (games, { gte, lte }) =>
			gte(games.date, startOfWeek) && lte(games.date, endOfWeek),
		with: {
			team_homeTeamId: true,
			team_awayTeamId: true,
			interactions: true,
		},
	})

	return c.json(result)
})

games.get('/week/:week', async (c) => {
	const week = Number.parseInt(c.req.param('week'))
	const db = c.get('db')
	const result = await db.query.games.findMany({
		where: (games, { eq }) => eq(games.week, week),
		with: {
			team_homeTeamId: true,
			team_awayTeamId: true,
			interactions: true,
		},
	})
	return c.json(result)
})

export default games
