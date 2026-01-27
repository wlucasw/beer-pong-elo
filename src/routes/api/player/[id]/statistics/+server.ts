import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const GET: RequestHandler = async ({ params }) => {
	const playerId = Number(params.id);
	if (Number.isNaN(playerId)) {
		return new Response(JSON.stringify({ error: 'Invalid player id' }), { status: 400 });
	}

	const stat = await prisma.statistics.findUnique({where:{playerId}});

	if (stat) {
		const matchesPlayed = stat.matchesPlayed;
		const wins = stat.wins;
		const losses = stat.losses;
		const accuracy = stat.accuracy * 100;
		const winPercent = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
		return new Response(
			JSON.stringify({
				matchesPlayed,
				wins,
				losses,
				winPercent,
				accuracy,
				bounceShots: stat.bounceShots,
				opponentsAccuracyDiff: stat.opponentsAccuracyDiff != null ? stat.opponentsAccuracyDiff * 100 : 0
			}),
			{ status: 200 }
		);
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
	const accuracy = totalShots === 0 ? 0 : (hits / totalShots) * 100;
	const winPercent = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;

	// Do not compute opponentsAccuracyDiff on the fly, it's too expensive
	const opponentsAccuracyDiff = 0;


	return new Response(
		JSON.stringify({
			matchesPlayed,
			wins,
			losses,
			winPercent,
			accuracy,
			bounceShots,
			opponentsAccuracyDiff
		}),
		{ status: 200 }
	);
};


