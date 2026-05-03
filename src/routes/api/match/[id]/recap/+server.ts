import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { ShotRecap } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const matchId = params.id;

	if (!matchId) {
		return json({ error: 'Match ID is required' }, { status: 400 });
	}

	try {
		const shots = await prisma.shot.findMany({
			where: { matchId: parseInt(matchId) },
			orderBy: { createdAt: 'asc' }
		});
		const playerIds = Array.from(new Set(shots.map((shot) => shot.playerId)));
		const players = await prisma.player.findMany({
			where: { id: { in: playerIds } },
			select: { id: true, name: true }
		});
		const playerMap = Object.fromEntries(players.map((p) => [p.id, p.name]));
		const updatedShots: ShotRecap[] = shots.map((shot) => ({
			playerId: shot.playerId,
			player: playerMap[shot.playerId] ?? null,
			cup: shot.cup,
			bounceCup: shot.bounceCup,
			hit: shot.hit,
			team: shot.team,
			round: shot.round,
			sequence: shot.sequence
		}));

		return json(updatedShots);
	} catch (error) {
		return json({ error: `Failed to fetch shots: ${error}` }, { status: 500 });
	}
};
