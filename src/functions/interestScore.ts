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
