export default function calculateInterestScore(game) {
	const homeTeam = game.team_homeTeamId
	const awayTeam = game.team_awayTeamId

	let score = 0

	// Team Performance Similarity (0-30 points)
	const teamPerformanceSimilarityScore = (homeTeam, awayTeam) => {
		let totalGames1 = homeTeam.wins + homeTeam.losses + homeTeam.ties
		let totalGames2 = awayTeam.wins + awayTeam.losses + awayTeam.ties
		if (totalGames1 === 0) {
			totalGames1 = 1
		}
		if (totalGames2 === 0) {
			totalGames2 = 1
		}

		const winPercentage1 = homeTeam.wins / totalGames1
		const winPercentage2 = awayTeam.wins / totalGames2

		// Calculate the difference in win percentages
		const winPercentageDifference = Math.abs(winPercentage1 - winPercentage2)

		// Convert the difference to a similarity score (0-30)
		// A difference of 0 gives 30 points, a difference of 1 gives 0 points
		return 30 * (1 - winPercentageDifference)
	}

	score += teamPerformanceSimilarityScore(homeTeam, awayTeam)

	const analyzeRankings = (homeTeam, awayTeam) => {
		const baseRank = 100
		const validHomeRanks = [
			homeTeam.apRank,
			homeTeam.coachesRank,
			homeTeam.cfpRank,
		].filter((rank) => rank !== null && rank !== undefined)

		const homeTeamRank =
			validHomeRanks.length > 0
				? Math.min(...validHomeRanks, baseRank)
				: baseRank

		const validAwayRanks = [
			awayTeam.apRank,
			awayTeam.coachesRank,
			awayTeam.cfpRank,
		].filter((rank) => rank !== null && rank !== undefined)

		const awayTeamRank =
			validAwayRanks.length > 0
				? Math.min(...validAwayRanks, baseRank)
				: baseRank

		console.log(homeTeamRank, awayTeamRank)

		const rankDifference = Math.abs(homeTeamRank - awayTeamRank)
		console.log(rankDifference)

		console.log(10 * (1 - rankDifference / baseRank))
		return 10 * (1 - rankDifference / baseRank)
	}

	score += analyzeRankings(homeTeam, awayTeam)

	if (
		homeTeam.apRank ||
		awayTeam.apRank ||
		homeTeam.coachesRank ||
		awayTeam.coachesRank ||
		homeTeam.cfpRank ||
		awayTeam.cfpRank
	) {
		score += 10
	}

	if (
		homeTeam.apRank < 10 ||
		awayTeam.apRank < 10 ||
		homeTeam.coachesRank < 10 ||
		awayTeam.coachesRank < 10 ||
		homeTeam.cfpRank < 10 ||
		awayTeam.cfpRank < 10
	) {
		score += 10
	}

	if (homeTeam.division !== awayTeam.division) {
		score -= 10
	}

	if (homeTeam.division === 'fcs' && awayTeam.division === 'fcs') {
		score -= 10
	}

	const deductForLosses = (homeTeam, awayTeam) => {
		const homePenalty = homeTeam.losses * 2
		const awayPenalty = awayTeam.losses * 2
		return homePenalty + awayPenalty
	}

	score -= deductForLosses(homeTeam, awayTeam)

	const processInteractions = (interactions) => {
		let interactionScore = 0
		for (const interaction of interactions) {
			if (interaction.interactionType === 'Hot') {
				interactionScore += 4
			} else if (interaction.interactionType === 'Sicko') {
				interactionScore += 6
			} else if (interaction.interactionType === 'Watch This') {
				interactionScore += 2
			} else if (interaction.interactionType === 'Upset Alert') {
				interactionScore += 6
			} else if (interaction.interactionType === 'Snoozer') {
				interactionScore -= 4
			}
		}
		return interactionScore
	}

	score += processInteractions(game.interactions)

	if (homeTeam.conferenceId === awayTeam.conferenceId) {
		score += 10
	}

	if (game.rivalry) {
		score += 10
	}

	return Math.round(score)
}

export const calculateGameInterest = (game) => {
	let score = 0

	// 1. Team Rankings (0-25 points)
	const rankedTeams = [game.team_homeTeamId, game.team_awayTeamId].filter(
		(team) => team.apRank || team.coachesRank
	)
	if (rankedTeams.length === 2) {
		score += 25
		const highestRank = Math.min(
			rankedTeams[0].apRank || rankedTeams[0].coachesRank || 25,
			rankedTeams[1].apRank || rankedTeams[1].coachesRank || 25
		)
		score += 25 - highestRank
	} else if (rankedTeams.length === 1) {
		score += 15
	}

	// 2. Conference Matchup (0-10 points)
	score += game.type === 'conference' ? 10 : 5

	// 3. Rivalry Game (0-15 points)
	score += game.rivalry ? 15 : 0

	// 4. Team Records (0-10 points)
	const homeUndefeated = game.team_homeTeamId.losses === 0
	const awayUndefeated = game.team_awayTeamId.losses === 0
	if (homeUndefeated && awayUndefeated) {
		score += 10
	} else if (homeUndefeated || awayUndefeated) {
		score += 5
	}

	// 5. Similar Team Records (0-10 points)
	const recordDifference = Math.abs(
		game.team_homeTeamId.wins - game.team_awayTeamId.wins
	)
	if (recordDifference === 0) {
		score += 10
	} else if (recordDifference === 1) {
		score += 7
	} else if (recordDifference === 2) {
		score += 4
	}

	// 6. Betting Line (0-15 points)
	const spread = Number.parseFloat(game.spread.split(' ')[1])
	if (spread <= 3) {
		score += 15
	} else if (spread <= 7) {
		score += 10
	} else if (spread <= 14) {
		score += 5
	}

	// 7. Over/Under (0-10 points)
	const overUnder = Number.parseFloat(game.overUnder)
	if (overUnder > 60) {
		score += 10
	} else if (overUnder >= 45) {
		score += 5
	}

	// 8. TV Network (0-5 points)
	const majorNetworks = ['ESPN', 'ABC', 'FOX', 'CBS']
	const cableNetworks = ['FS1', 'ESPNU']
	if (majorNetworks.includes(game.tvNetwork)) {
		score += 5
	} else if (cableNetworks.includes(game.tvNetwork)) {
		score += 3
	} else {
		score += 1
	}

	// 9. Time Slot (0-5 points)
	const gameHour = new Date(game.gameStart).getHours()
	if (gameHour >= 19) {
		score += 5
	} else if (gameHour >= 12) {
		score += 3
	} else {
		score += 1
	}

	// 10. Stadium/Venue (0-5 points)
	// This would require a predefined list of historic stadiums
	// For now, we'll leave it at 0

	return score
}
