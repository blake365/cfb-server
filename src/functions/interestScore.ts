export const calculateGameInterest = (game) => {
	let score = 0;

	const fbsIndependents = [321, 413, 656];
	const powerConferences = [1, 2, 3, 4, 5];

	// 1. Team Rankings (0-25 points)
	const rankedTeams = [game.team_homeTeamId, game.team_awayTeamId].filter(
		(team) => team.apRank || team.coachesRank,
	);
	if (rankedTeams.length === 2) {
		score += 25;
		const highestRank = Math.min(
			rankedTeams[0].apRank || rankedTeams[0].coachesRank || 25,
			rankedTeams[1].apRank || rankedTeams[1].coachesRank || 25,
		);
		score += 25 - highestRank;
	} else if (rankedTeams.length === 1) {
		score += 15;
	}

	// 2. Conference Matchup (0-10 points)
	score += game.type === "conference" ? 10 : 5;

	// if one team is an independent, add 5 points
	if (fbsIndependents.includes(game.team_homeTeamId.id)) {
		score += 5;
	}
	if (fbsIndependents.includes(game.team_awayTeamId.id)) {
		score += 5;
	}

	if (powerConferences.includes(game.team_homeTeamId.conferenceId)) {
		score += 2;
	}
	if (powerConferences.includes(game.team_awayTeamId.conferenceId)) {
		score += 2;
	}

	// 3. Rivalry Game (0-15 points)
	score += game.rivalry ? 10 : 0;

	// 4. Team Records (0-10 points)
	const homeUndefeated = game.team_homeTeamId.losses === 0;
	const awayUndefeated = game.team_awayTeamId.losses === 0;
	if (homeUndefeated && awayUndefeated) {
		score += 10;
	} else if (homeUndefeated || awayUndefeated) {
		score += 5;
	}

	// 5. Similar Team Records (0-10 points)
	const recordDifference = Math.abs(
		game.team_homeTeamId.wins - game.team_awayTeamId.wins,
	);
	if (recordDifference === 0) {
		score += 10;
	} else if (recordDifference === 1) {
		score += 7;
	} else if (recordDifference === 2) {
		score += 4;
	}

	// 6. Betting Line (0-15 points)
	const spreadMatch = game?.spread?.match(/-?\d+(\.\d+)?/);
	const spread = spreadMatch ? Number.parseFloat(spreadMatch[0]) : null;
	if (spread !== null) {
		if (Math.abs(spread) <= 3) {
			score += 15;
		} else if (Math.abs(spread) <= 7) {
			score += 10;
		} else if (Math.abs(spread) <= 14) {
			score += 5;
		}
	}

	// 7. Over/Under (0-10 points)
	const overUnder = Number.parseFloat(game.overUnder);
	if (overUnder > 60) {
		score += 10;
	} else if (overUnder >= 45) {
		score += 5;
	}

	// 8. TV Network (0-5 points)
	// const majorNetworks = ["ESPN", "ABC", "FOX", "CBS"];
	// if (majorNetworks.includes(game.tvNetwork)) {
	// 	score += 5;
	// } else {
	// 	score += 3;
	// }

	// 9. Time Slot (0-5 points)
	// const gameHour = new Date(game.gameStart).getHours();
	// if (gameHour >= 19) {
	// 	score += 5;
	// } else if (gameHour >= 12) {
	// 	score += 3;
	// } else {
	// 	score += 1;
	// }

	const processInteractions = (interactions) => {
		let interactionScore = 0;
		for (const interaction of interactions) {
			if (interaction.interactionType === "Starry") {
				interactionScore += 4;
			} else if (interaction.interactionType === "Sicko") {
				interactionScore += 6;
			} else if (interaction.interactionType === "Curious") {
				interactionScore += 2;
			} else if (interaction.interactionType === "Panic") {
				interactionScore += 6;
			} else if (interaction.interactionType === "Snoozer") {
				interactionScore -= 4;
			}
		}
		return interactionScore;
	};

	score += processInteractions(game.interactions);

	// 10. Stadium/Venue (0-5 points)
	// This would require a predefined list of historic stadiums
	// For now, we'll leave it at 0

	return score;
};
