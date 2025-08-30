import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const matchId = params.id;

	if (!matchId) {
		return new Response(JSON.stringify({ error: 'Match ID is required' }), { status: 400 });
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
		const updatedShots = shots.map((shot) => {
			return {
				playerId: shot.playerId,
				player: playerMap[shot.playerId] || null,
				cup: shot.cup,
				hit: shot.hit,
				team: shot.team,
				sequence: shot.sequence
			};
		});

		return new Response(JSON.stringify(updatedShots), { status: 200 });
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to fetch shots: ${error}` }), {
			status: 500
		});
	}
};
