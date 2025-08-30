import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';

// ELO calculation helper
function calculateElo(playerElo: number, opponentElo: number, score: number, k = 32) {
	const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
	return Math.round(playerElo + k * (score - expected));
}

export async function POST({ params, request }) {
	const matchId = Number(params.id);
	const { winner } = await request.json(); // winner = 'A' | 'B'

	if (!winner || !['A', 'B'].includes(winner)) {
		return json({ error: 'Invalid winner specified' }, { status: 400 });
	}

	// Fetch match with players
	const match = await prisma.match.findUnique({
		where: { id: matchId },
		include: {
			teamAmineSide: { include: { player: true } },
			teamRobinSide: { include: { player: true } }
		}
	});

	if (!match) {
		return json({ error: 'Match not found' }, { status: 404 });
	}

	// Update match status
	await prisma.match.update({
		where: { id: matchId },
		data: {
			winnerA: winner === 'A',
			winnerB: winner === 'B',
			status: 'FINISHED'
		}
	});

	// Update Elo for players
	const teamAScore = winner === 'A' ? 1 : 0;
	const teamBScore = winner === 'B' ? 1 : 0;

	for (const playerA of match.teamAmineSide) {
		for (const playerB of match.teamRobinSide) {
			const newEloA = calculateElo(playerA.player.elo, playerB.player.elo, teamAScore);
			const newEloB = calculateElo(playerB.player.elo, playerA.player.elo, teamBScore);

			await prisma.player.update({
				where: { id: playerA.playerId },
				data: { elo: newEloA }
			});

			await prisma.player.update({
				where: { id: playerB.playerId },
				data: { elo: newEloB }
			});
		}
	}

	return json({ message: 'Match ended successfully', winner });
}
