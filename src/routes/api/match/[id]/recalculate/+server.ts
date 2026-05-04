import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import { recalculateRounds } from '$lib/server/recalculateRounds';

export const POST: RequestHandler = async ({ params, request }) => {
	const matchId = Number(params.id);
	const { numberOfShotByMatch } = await request.json();

	if (!Number.isInteger(numberOfShotByMatch) || numberOfShotByMatch < 1) {
		throw error(400, 'numberOfShotByMatch must be a positive integer');
	}

	await prisma.match.update({
		where: { id: matchId },
		data: { numberOfShotByMatch }
	});

	await recalculateRounds(matchId, numberOfShotByMatch);

	const match = await prisma.match.findUnique({
		where: { id: matchId },
		include: {
			teamAmineSide: { include: { player: true } },
			teamRobinSide: { include: { player: true } }
		}
	});

	return json(match);
};
