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

	return Math.round(k * (outcome - expected) * (0.6 + 0.4 * margin));
}

export async function POST({ params, request }) {
	const matchId = Number(params.id);
	const { winner, teamARemainingCups, teamBRemainingCups } = await request.json(); // winner = 'A' | 'B'

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
	const teamBRemainingCupsFromDB = 10 - shotWithHitTeamA.length - shotWithBounceTeamA.length;
	const teamARemainingCupsFromDB = 10 - shotWithHitTeamB.length - shotWithBounceTeamB.length;

	const teamARemainingCupsFinal =
		teamARemainingCups !== undefined ? teamARemainingCups : teamARemainingCupsFromDB;
	const teamBRemainingCupsFinal =
		teamBRemainingCups !== undefined ? teamBRemainingCups : teamBRemainingCupsFromDB;

	// Update Elo for players
	const teamAScore = winner === 'A' ? 1 : 0;
	const teamBScore = winner === 'B' ? 1 : 0;

	const TeamAElo =
		match.teamAmineSide.reduce((sum, p) => sum + p.player.elo, 0) / match.teamAmineSide.length;
	const TeamBElo =
		match.teamRobinSide.reduce((sum, p) => sum + p.player.elo, 0) / match.teamRobinSide.length;

	const eloVariationTeamA = calculateElo(TeamAElo, TeamBElo, {
		didWin: teamAScore === 1,
		playerCupsRemaining: teamARemainingCupsFinal,
		opponentCupsRemaining: teamBRemainingCupsFinal
	});

	const eloVariationTeamB = calculateElo(TeamBElo, TeamAElo, {
		didWin: teamBScore === 1,
		playerCupsRemaining: teamBRemainingCupsFinal,
		opponentCupsRemaining: teamARemainingCupsFinal
	});
	for (const playerA of match.teamAmineSide) {
		await prisma.player.update({
			where: { id: playerA.playerId },
			data: { elo: playerA.player.elo + eloVariationTeamA }
		});
	}
	for (const playerB of match.teamRobinSide) {
		await prisma.player.update({
			where: { id: playerB.playerId },
			data: { elo: playerB.player.elo + eloVariationTeamB }
		});
	}

	return json({ message: 'Match ended successfully', winner });
}
