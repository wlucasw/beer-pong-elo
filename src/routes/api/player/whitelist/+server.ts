import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWhitelistedPlayers, setWhitelistedPlayers } from '$lib/server/whitelist';

export const GET: RequestHandler = async () => {
	const players: string[] = getWhitelistedPlayers();
	return json(players);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body || !Array.isArray(body.players) || !body.players.every((p: unknown) => typeof p === 'string')) {
		return json({ error: 'Invalid payload' }, { status: 400 });
	}
	setWhitelistedPlayers(body.players);
	return json({ ok: true });
};
