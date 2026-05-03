import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { computeMatchupsForPlayer } from '$lib/server/matchups';
import type { MatchupApiRow } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const playerId = Number(params.id);
	if (!playerId || Number.isNaN(playerId)) {
		return json({ error: 'Invalid player id' }, { status: 400 });
	}
	const { byOpponents }: { byOpponents: MatchupApiRow[] } = await computeMatchupsForPlayer(playerId);
	return json(byOpponents);
};
