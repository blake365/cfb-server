import { Hono } from 'hono'
import * as schema from '../../drizzle/schema'
import { asc, or } from 'drizzle-orm'

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

	const filteredResult = result.filter((team) => {
		return (
			team.conference.classification === 'fbs' ||
			team.conference.classification === 'fcs'
		)
	})
	return c.json(filteredResult)
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

teams.get('/name/:name', async (c) => {
	const db = c.get('db')
	const name = c.req.param('name')
	console.log(name)
	const result = await db.query.teams.findFirst({
		where: (teams, { eq }) => eq(teams.name, name),
		with: {
			conference: true,
			teamstats: true,
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

teams.get('/conference/:slug', async (c) => {
	const db = c.get('db')
	const slug = c.req.param('slug')
	console.log(slug)
	const conference = await db.query.conferences.findFirst({
		where: (conferences, { eq }) => eq(conferences.abbreviation, slug),
	})

	const conferenceId = conference[0]?.id
	console.log(conferenceId)

	const result = await db.query.teams.findMany({
		where: (teams, { eq }) => eq(teams.conferenceId, conferenceId),
	})
	return c.json(result)
})

teams.get('/newTeamsFromApi/hello', async (c) => {
	const db = c.get('db')
	try {
		console.log('Fetching teams from API')
		const apiTeams = await fetch('https://api.collegefootballdata.com/teams', {
			headers: {
				Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
			},
		})
		const teams = await apiTeams.json()

		// console.log('API response status:', apiTeams.status)
		// console.log('API response ok:', apiTeams.ok)

		const conferences = await fetch('http://localhost:3001/conferences')
		const conferenceData = await conferences.json()

		for (const team of teams) {
			const conference = conferenceData.find(
				(conference) => conference.name === team.conference
			)

			// console.log(conference)

			if (!conference) {
				console.log('Conference not found for team:', team.school)
				continue
			}

			await db.insert(schema.teams).values({
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
			})
		}

		// console.log(teams)
		return c.json({ message: 'Teams added' })
	} catch (error) {
		console.error('Error in newTeamsFromApi:', error)
		return c.json({ error: error.message }, { status: 500 })
	}
})

teams.get('/newGamesFromApi/hello', async (c) => {
	const db = c.get('db')
	try {
		console.log('Fetching games from API')
		const apiGames = await fetch(
			'https://api.collegefootballdata.com/games?year=2024&seasonType=regular&division=fbs',
			{
				headers: {
					Authorization: `Bearer ${Bun.env.cfbdata_api_key}`,
				},
			}
		)
		const games = await apiGames.json()

		console.log('API response status:', apiGames.status)
		console.log('API response ok:', apiGames.ok)

		for (const game of games) {
			let type = game.season_type
			if (game.conference_game) {
				type = 'conference'
			}

			const awayTeam = await db.query.teams.findFirst({
				where: (teams, { eq }) => eq(teams.cfbApiId, game.away_id),
			})
			const homeTeam = await db.query.teams.findFirst({
				where: (teams, { eq }) => eq(teams.cfbApiId, game.home_id),
			})

			if (!awayTeam || !homeTeam) {
				console.log('Team not found for game:', game)
				continue
			}

			await db
				.insert(schema.games)
				.values({
					awayTeamId: game.away_id,
					homeTeamId: game.home_id,
					awayTeamScore: game.away_points,
					homeTeamScore: game.home_points,
					gameStart: game.start_date,
					seasonId: 1,
					week: game.week,
					type: type,
					cfbApiId: game.id,
					location: game.venue,
				})
				.onConflictDoNothing()
		}

		// console.log(teams)
		return c.json({ message: 'Games added' })
	} catch (error) {
		console.error('Error in newTeamsFromApi:', error)
		return c.json({ error: error.message }, { status: 500 })
	}
})

export default teams
