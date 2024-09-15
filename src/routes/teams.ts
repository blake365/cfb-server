import { Hono } from 'hono'
import * as schema from '../../drizzle/schema'
import { asc } from 'drizzle-orm'

const teams = new Hono()

teams.get('/', async (c) => {
	const db = c.get('db')
	const result = await db.query.teams.findMany({
		with: {
			conference: true,
			games_awayTeamId: true,
			games_homeTeamId: true,
		},
		orderBy: [asc(schema.teams.name)],
	})
	return c.json(result)
})

teams.get('/:id', async (c) => {
	const db = c.get('db')
	const result = await db.query.teams.findFirst({
		where: (teams, { eq }) => eq(teams.id, Number.parseInt(c.req.param('id'))),
		with: {
			conference: true,
			games_awayTeamId: true,
			games_homeTeamId: true,
		},
	})
	return c.json(result)
})

teams.put('/:id', async (c) => {
	const db = c.get('db')
	const body = await c.req.json()
	const result = await db
		.update(schema.teams)
		.set(body)
		.where(eq(schema.teams.id, Number.parseInt(c.req.param('id'))))
	return c.json(result)
})

teams.post('/new', async (c) => {
	const db = c.get('db')
	const body = await c.req.json()
	const result = await db.insert(schema.teams).values(body)
	return c.json(result)
})

export default teams
