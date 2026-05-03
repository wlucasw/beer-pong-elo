import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const { sequence, team } = await request.json();
		const matchId = Number(params.id);

		if (!matchId || !sequence || !team) {
			return json({ error: 'Missing matchId, sequence or team' }, { status: 400 });
		}

		const shot = await prisma.shot.findFirst({
			where: { matchId, sequence, team }
		});

		if (!shot) {
			return json({ error: 'Shot not found' }, { status: 404 });
		}

		await prisma.shot.delete({
			where: { id: shot.id }
		});

		return json({ success: true });
	} catch (err) {
		console.error(err);
		return json({ error: 'Server error' }, { status: 500 });
	}
};
