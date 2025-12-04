import type { RequestHandler } from '@sveltejs/kit';
import { computeMatchupsForPlayer } from '$lib/server/matchups';

export const GET: RequestHandler = async ({ params }) => {
	const playerId = Number(params.id);
	if (!playerId || Number.isNaN(playerId)) {
		return new Response(JSON.stringify({ error: 'Invalid player id' }), { status: 400 });
	}
	const result = await computeMatchupsForPlayer(playerId);
	return new Response(JSON.stringify(result), { status: 200 });
};
