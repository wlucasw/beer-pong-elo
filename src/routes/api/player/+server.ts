import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import type { PlayerLeaderboard } from '$lib/types';

export const GET: RequestHandler = async () => {
	const rows = await prisma.player.findMany({
		orderBy: { elo: 'desc' },
		include: { Statistics: true }
	});
	const players: PlayerLeaderboard[] = rows.map((p) => ({
		id: p.id,
		name: p.name,
		elo: p.elo,
		matchesPlayed: p.Statistics?.matchesPlayed ?? 0,
		winPercent:
			p.Statistics && p.Statistics.matchesPlayed > 0
				? (p.Statistics.wins / p.Statistics.matchesPlayed) * 100
				: 0,
		accuracy: p.Statistics ? p.Statistics.accuracy * 100 : 0
	}));
	return json(players);
};

export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();
	const p = await prisma.player.create({ data: { name } });
	const player: PlayerLeaderboard = { id: p.id, name: p.name, elo: p.elo, matchesPlayed: 0, winPercent: 0, accuracy: 0 };
	return json(player);
};
