import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { matchId, playerId, cups, team, sequence } = await request.json();

		if (!matchId || !playerId || !cups || cups.length !== 2) {
			return new Response(JSON.stringify({ error: 'Two cups required for bounce' }), {
				status: 400
			});
		}

		// Create two shots in DB
		await prisma.shot.create({
			data: {
				matchId,
				playerId,
				hit: true,
				cup: cups[0],
				bounceCup: cups[1],
				team,
				sequence: sequence
			}
		});

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
};
