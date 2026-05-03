import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request }) => {
	const { matchId, playerId, hit, cup, team, sequence, round, isCounter } = await request.json();

	const shot = await prisma.shot.create({
		data: { matchId, playerId, hit, cup, team, sequence, round, isCounter }
	});

	return json(shot);
};
