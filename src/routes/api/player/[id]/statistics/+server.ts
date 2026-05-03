import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PlayerStats } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const playerId = Number(params.id);
	if (Number.isNaN(playerId)) {
		return json({ error: 'Invalid player id' }, { status: 400 });
	}

	const stat = await prisma.statistics.findUnique({ where: { playerId } });

	if (stat) {
		const response: PlayerStats = {
			matchesPlayed: stat.matchesPlayed,
			wins: stat.wins,
			losses: stat.losses,
			winPercent: stat.matchesPlayed > 0 ? (stat.wins / stat.matchesPlayed) * 100 : 0,
			accuracy: stat.accuracy * 100,
			bounceShots: stat.bounceShots,
			opponentsAccuracyDiff: stat.opponentsAccuracyDiff != null ? stat.opponentsAccuracyDiff * 100 : 0
		};
		return json(response);
	}

	// Fallback compute if no statistics row exists yet
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

	const response: PlayerStats = {
		matchesPlayed,
		wins,
		losses,
		winPercent: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0,
		accuracy: totalShots === 0 ? 0 : (hits / totalShots) * 100,
		bounceShots,
		opponentsAccuracyDiff: 0
	};

	return json(response);
};
