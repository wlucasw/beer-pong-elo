import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';

export const GET: RequestHandler = async () => {
	const players = await prisma.player.findMany({ orderBy: { elo: 'desc' } });
	return new Response(JSON.stringify(players));
};

export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();
	const player = await prisma.player.create({ data: { name } });
	return new Response(JSON.stringify(player));
};
