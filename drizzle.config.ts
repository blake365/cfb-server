import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: './drizzle/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: 'postgresql://postgres:hokies@localhost:5432/collegefootball',
	},
})
