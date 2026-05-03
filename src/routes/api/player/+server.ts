import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import type { Player } from '$lib/types';

export const GET: RequestHandler = async () => {
	const players: Player[] = await prisma.player.findMany({ orderBy: { elo: 'desc' } });
	return json(players);
};

export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();
	const player: Player = await prisma.player.create({ data: { name } });
	return json(player);
};
