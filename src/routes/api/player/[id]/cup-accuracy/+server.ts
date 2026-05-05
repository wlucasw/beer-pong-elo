import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { CupAccuracyPoint } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const playerId = Number(params.id);
	if (Number.isNaN(playerId)) {
		return json({ error: 'Invalid player id' }, { status: 400 });
	}

	const playerShots = await prisma.shot.findMany({
		where: { playerId },
		select: { matchId: true, team: true, sequence: true, hit: true, bounceCup: true }
	});

	if (playerShots.length === 0) {
		return json(buildEmptyResult());
	}

	const matchIds = [...new Set(playerShots.map((s) => s.matchId))];
	const allMatchShots = await prisma.shot.findMany({
		where: { matchId: { in: matchIds } },
		select: { matchId: true, team: true, sequence: true, hit: true, bounceCup: true }
	});

	// Group match shots by (matchId, team), sorted by sequence
	const matchTeamShots = new Map<string, typeof allMatchShots>();
	for (const shot of allMatchShots) {
		const key = `${shot.matchId}:${shot.team}`;
		if (!matchTeamShots.has(key)) matchTeamShots.set(key, []);
		matchTeamShots.get(key)!.push(shot);
	}
	for (const shots of matchTeamShots.values()) {
		shots.sort((a, b) => a.sequence - b.sequence);
	}

	// Compute cups remaining at each shot (before it is taken)
	const cupsRemainingMap = new Map<string, number>();
	for (const [key, shots] of matchTeamShots) {
		const [matchId, team] = key.split(':');
		let cupsRemoved = 0;
		for (const shot of shots) {
			cupsRemainingMap.set(`${matchId}:${team}:${shot.sequence}`, Math.max(0, 10 - cupsRemoved));
			if (shot.hit) cupsRemoved++;
			if (shot.bounceCup != null) cupsRemoved++;
		}
	}

	const buckets: Record<number, { hits: number; total: number }> = {};
	for (let i = 1; i <= 10; i++) buckets[i] = { hits: 0, total: 0 };

	for (const shot of playerShots) {
		const cupsRemaining = cupsRemainingMap.get(`${shot.matchId}:${shot.team}:${shot.sequence}`) ?? 10;
		if (cupsRemaining < 1) continue;
		buckets[cupsRemaining].total++;
		if (shot.hit) buckets[cupsRemaining].hits++;
	}

	const result: CupAccuracyPoint[] = Object.entries(buckets).map(([cups, { hits, total }]) => ({
		cupsRemaining: Number(cups),
		hits,
		total,
		accuracy: total === 0 ? 0 : (hits / total) * 100
	}));

	return json(result);
};

function buildEmptyResult(): CupAccuracyPoint[] {
	return Array.from({ length: 10 }, (_, i) => ({
		cupsRemaining: i + 1,
		hits: 0,
		total: 0,
		accuracy: 0
	}));
}
