import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { computeMatchupsForPlayer } from '$lib/server/matchups';
import type { MatchupResponse } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const playerId = Number(params.id);
	if (!playerId || Number.isNaN(playerId)) {
		return json({ error: 'Invalid player id' }, { status: 400 });
	}
	const result: MatchupResponse = await computeMatchupsForPlayer(playerId);
	return json(result);
};
