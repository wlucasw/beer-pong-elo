import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { matchId, playerId, cups, team, sequence } = await request.json();

		if (!matchId || !playerId || !cups || cups.length !== 2) {
			return json({ error: 'Two cups required for bounce' }, { status: 400 });
		}

		await prisma.shot.create({
			data: {
				matchId,
				playerId,
				hit: true,
				cup: cups[0],
				bounceCup: cups[1],
				team,
				sequence
			}
		});

		return json({ success: true });
	} catch (err) {
		console.error(err);
		return json({ error: 'Server error' }, { status: 500 });
	}
};
