import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const { sequence, team } = await request.json();
		const matchId = Number(params.id);

		if (!matchId || !sequence || !team) {
			return new Response(JSON.stringify({ error: 'Missing matchId, sequence or team' }), {
				status: 400
			});
		}

		// Find the shot
		const shot = await prisma.shot.findFirst({
			where: { matchId, sequence, team }
		});

		if (!shot) {
			return new Response(JSON.stringify({ error: 'Shot not found' }), {
				status: 404
			});
		}

		// Delete the shot
		await prisma.shot.delete({
			where: { id: shot.id }
		});

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ error: 'Server error' }), {
			status: 500
		});
	}
};
