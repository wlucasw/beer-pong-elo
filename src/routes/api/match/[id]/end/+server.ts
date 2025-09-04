import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';

// Elo calculation with cups remaining
function calculateElo(
	playerElo: number,
	opponentElo: number,
	{
		didWin,
		playerCupsRemaining,
		opponentCupsRemaining,
		k = 120
	}: {
		didWin: boolean;
		playerCupsRemaining: number; // 0..10
		opponentCupsRemaining: number; // 0..10
		k?: number;
	}
) {
	// Expected score based on rating difference
	const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

	// Base outcome (1 = win, 0 = loss)
	const outcome = didWin ? 1 : 0;

	// Margin factor from cups remaining
	//   - If both at 0 → 0.5 (neutral)
	//   - If player has more remaining → closer to 1
	//   - If fewer → closer to 0
	const margin = Math.abs(playerCupsRemaining - opponentCupsRemaining) / 10;

	return Math.round(playerElo + k * (outcome - expected) * (0.2 + 0.8 * margin));
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

	const shots = await prisma.shot.findMany({
		where: { matchId }
	});

	const shotWithHitTeamA = shots.filter((shot) => shot.hit && shot.team === 'A');
	const shotWithHitTeamB = shots.filter((shot) => shot.hit && shot.team === 'B');
	const shotWithBounceTeamA = shots.filter((shot) => shot.bounceCup && shot.team === 'A');
	const shotWithBounceTeamB = shots.filter((shot) => shot.bounceCup && shot.team === 'B');
	const teamBRemainingCups = 10 - shotWithHitTeamA.length - shotWithBounceTeamA.length;
	const teamARemainingCups = 10 - shotWithHitTeamB.length - shotWithBounceTeamB.length;

	// Update Elo for players
	const teamAScore = winner === 'A' ? 1 : 0;
	const teamBScore = winner === 'B' ? 1 : 0;

	for (const playerA of match.teamAmineSide) {
		for (const playerB of match.teamRobinSide) {
			const newEloA = calculateElo(playerA.player.elo, playerB.player.elo, {
				didWin: teamAScore === 1,
				playerCupsRemaining: teamARemainingCups,
				opponentCupsRemaining: teamBRemainingCups
			});
			const newEloB = calculateElo(playerB.player.elo, playerA.player.elo, {
				didWin: teamBScore === 1,
				playerCupsRemaining: teamBRemainingCups,
				opponentCupsRemaining: teamARemainingCups
			});

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
