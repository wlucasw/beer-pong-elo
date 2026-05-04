import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Prisma } from '@prisma/client';
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

async function upsertPlayerStatistics(playerId: number) {
	// Aggregate global stats to keep a single source of truth
	const [totalShots, hits, bounceShots, matchesPlayed, wins] = await Promise.all([
		prisma.shot.count({ where: { playerId } }),
		prisma.shot.count({ where: { playerId, hit: true } }),
		prisma.shot.count({ where: { playerId, bounceCup: { not: null } } }),
		prisma.match.count({
			where: {
				status: 'FINISHED',
				OR: [{ teamAmineSide: { some: { playerId } } }, { teamRobinSide: { some: { playerId } } }]
			}
		}),
		prisma.match.count({
			where: {
				status: 'FINISHED',
				OR: [
					{ AND: [{ teamAmineSide: { some: { playerId } } }, { winnerA: true }] },
					{ AND: [{ teamRobinSide: { some: { playerId } } }, { winnerB: true }] }
				]
			}
		})
	]);
	const losses = Math.max(0, matchesPlayed - wins);
	const accuracy = totalShots === 0 ? 0 : hits / totalShots;
	const counterShots = await prisma.shot.count({ where: { playerId, isCounter: true } });
	const counterHits = await prisma.shot.count({ where: { playerId, isCounter: true, hit: true } });
	const counterAccuracy = counterShots === 0 ? 0 : counterHits / counterShots;

	await prisma.statistics.upsert({
		where: { playerId },
		update: {
			accuracy,
			matchesPlayed,
			wins,
			losses,
			bounceShots,
			counterAccuracy
		},
		create: {
			playerId,
			accuracy,
			matchesPlayed,
			wins,
			losses,
			bounceShots,
			counterAccuracy
		}
	});
}

export const POST: RequestHandler = async ({ params, request }) => {
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
	// Save elo variations on the match
	await prisma.match.update({
		where: { id: matchId },
		data: {
			eloVariationTeamA,
			eloVariationTeamB
		} as unknown as Prisma.MatchUpdateInput
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

	// Compute and upsert Statistics for all players in this match
	const playerIds = [
		...match.teamAmineSide.map((p) => p.playerId),
		...match.teamRobinSide.map((p) => p.playerId)
	];
	const uniquePlayerIds = Array.from(new Set(playerIds));
	await Promise.all(uniquePlayerIds.map((pid) => upsertPlayerStatistics(pid)));

	const response: { message: string; winner: 'A' | 'B' } = { message: 'Match ended successfully', winner };
	return json(response);
};
