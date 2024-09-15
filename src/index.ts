console.log('Hello via Bun!')
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import * as schema from '../drizzle/schema'
import * as relations from '../drizzle/relations'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import teams from './routes/teams'
import games from './routes/games'
import conferences from './routes/conferences'
import interactions from './routes/interactions'
import cron from './routes/cron'

const client = new Client({
	connectionString:
		'postgresql://postgres:hokies@localhost:5432/collegefootball',
})

await client.connect()
const db = drizzle(client, { schema: { ...schema, ...relations } })

const app = new Hono()

// Add X-Response-Time header
app.use('*', async (c, next) => {
	c.set('db', db)
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

app.route('/teams', teams)
app.route('/games', games)
app.route('/conferences', conferences)
app.route('/interactions', interactions)
app.route('/cron', cron)

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
	return c.text('Welcome to the College Football Sickos API!')
})

export default {
	port: 3001,
	fetch: app.fetch,
}
