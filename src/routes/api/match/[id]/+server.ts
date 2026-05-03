import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import type { MatchFull } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const match = await prisma.match.findUnique({
		where: { id: Number(params.id) },
		include: {
			teamAmineSide: { include: { player: true } },
			teamRobinSide: { include: { player: true } }
		}
	});

	return json(match as unknown as MatchFull | null);
};
