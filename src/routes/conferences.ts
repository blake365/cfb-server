import { Hono } from 'hono'
import * as schema from '../../drizzle/schema'
import { eq } from 'drizzle-orm'

const conferences = new Hono()

conferences.get('/', async (c) => {
	const db = c.get('db')
	const result = await db.query.conferences.findMany({
		with: {
			teams: true,
		},
	})
	// console.log(result)
	return c.json(result)
})

conferences.get('/:id', async (c) => {
	const db = c.get('db')
	const result = await db.query.conferences.findFirst({
		where: (conferences, { eq }) =>
			eq(conferences.id, Number.parseInt(c.req.param('id'))),
		with: {
			teams: true,
		},
	})
	return c.json(result)
})

conferences.put('/:id', async (c) => {
	const db = c.get('db')
	const body = await c.req.json()
	const result = await db
		.update(schema.conferences)
		.set(body)
		.where(eq(schema.conferences.id, Number.parseInt(c.req.param('id'))))
	return c.json(result)
})

conferences.post('/', async (c) => {
	const db = c.get('db')
	const body = await c.req.json()
	const result = await db.insert(schema.conferences).values(body)
	return c.json(result)
})

export default conferences
