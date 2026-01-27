import type { RequestHandler } from './$types';
import { getWhitelistedPlayers, setWhitelistedPlayers } from '$lib/server/whitelist';

export const GET: RequestHandler = async () => {
	const players = getWhitelistedPlayers();
	return new Response(JSON.stringify(players), { status: 200 });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body || !Array.isArray(body.players) || !body.players.every((p) => typeof p === 'string')) {
		return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
	}
	setWhitelistedPlayers(body.players);
	return new Response(JSON.stringify({ ok: true }), { status: 200 });
};


