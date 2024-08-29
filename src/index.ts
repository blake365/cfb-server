console.log('Hello via Bun!')
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import * as schema from '../drizzle/schema'
import * as relations from '../drizzle/relations'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { asc } from 'drizzle-orm'

const client = new Client({
	connectionString:
		'postgresql://postgres:hokies@localhost:5432/collegefootball',
})

await client.connect()
const db = drizzle(client, { schema: { ...schema, ...relations } })

const app = new Hono()

// Add X-Response-Time header
app.use('*', async (c, next) => {
	const start = Date.now()
	await next()
	const ms = Date.now() - start
	c.header('X-Response-Time', `${ms}ms`)
})

app.use(logger())
app.use(
	'/*',
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
		credentials: true,
	})
)

// Custom Not Found Message
app.notFound((c) => {
	return c.text('Custom 404 Not Found', 404)
})

// Error handling
app.onError((err, c) => {
	console.error(`${err}`)
	return c.text('An Error Happened!', 500)
})

app.get('/', async (c) => {
	const result = await db.query.conferences.findMany({
		with: {
			teams: true,
		},
	})
	console.log(result)
	return c.json(result)
})

app.get('/teams', async (c) => {
	const result = await db.query.teams.findMany({
		with: {
			conference: true,
			games_awayTeamId: true,
			games_homeTeamId: true,
		},
		orderBy: [asc(schema.teams.name)],
	})
	console.log(result)
	return c.json(result)
})

app.get('/teams/:id', async (c) => {
	const result = await db.query.teams.findFirst({
		where: (teams, { eq }) => eq(teams.id, Number.parseInt(c.req.param('id'))),
		with: {
			conference: true,
			games_awayTeamId: true,
			games_homeTeamId: true,
		},
	})
	console.log(result)
	return c.json(result)
})

app.get('games', async (c) => {
	const result = await db.query.games.findMany({
		with: {
			team_homeTeamId: true,
			team_awayTeamId: true,
		},
	})
	console.log(result)
	return c.json(result)
})

app.post('/teams/new', async (c) => {
	const body = await c.req.json()
	console.log(body)
	const result = await db.insert(schema.teams).values(body)
	console.log(result)
	return c.json(result)
})

app.post('/games/new', async (c) => {
	const body = await c.req.json()
	console.log(body)
	const result = await db.insert(schema.games).values(body)
	console.log(result)
	return c.json(result)
})

app.get('/conferences', async (c) => {
	const result = await db.query.conferences.findMany()
	console.log(result)
	return c.json(result)
})

export default {
	port: 3001,
	fetch: app.fetch,
}
