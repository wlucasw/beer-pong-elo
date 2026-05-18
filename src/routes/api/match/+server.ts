import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import type { MatchFull, ShotStat } from '$lib/types';

// GET /api/match?finished=1
export const GET: RequestHandler = async ({ url }) => {
	try {
		const finishedOnly = url.searchParams.has('finished');
		const matches = await prisma.match.findMany({
			orderBy: { createdAt: 'desc' },
			include: {
				teamAmineSide: { include: { player: true } },
				teamRobinSide: { include: { player: true } },
				Shot: { select: { playerId: true, hit: true } }
			}
		});

		const filtered = finishedOnly ? matches.filter((m) => m.winnerA || m.winnerB) : matches;

		const data = filtered.map(({ Shot, ...match }) => {
			const byId: Record<number, { hits: number; total: number }> = {};
			for (const shot of Shot) {
				byId[shot.playerId] ??= { hits: 0, total: 0 };
				byId[shot.playerId].total++;
				if (shot.hit) byId[shot.playerId].hits++;
			}
			const allPlayers = [
				...match.teamAmineSide.map((e) => e.player),
				...match.teamRobinSide.map((e) => e.player)
			];
			const shotStats: ShotStat[] = allPlayers
				.filter((p) => byId[p.id])
				.map((p) => ({ playerName: p.name, hits: byId[p.id].hits, total: byId[p.id].total }));
			return { ...match, shotStats };
		}) as unknown as MatchFull[];

		return json(data);
	} catch (err) {
		console.error('Error fetching matches', err);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};

// POST /api/match
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { teamAmine, teamRobin, numberOfShotByMatch } = await request.json();

		if (teamAmine.length === 0 || teamRobin.length === 0 || !numberOfShotByMatch) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const match = await prisma.match.create({
			data: {
				winnerA: false,
				winnerB: false,
				teamAmineSide: {
					create: teamAmine.map((id: string) => ({
						playerId: Number(id)
					}))
				},
				teamRobinSide: {
					create: teamRobin.map((id: string) => ({
						playerId: Number(id)
					}))
				},
				numberOfShotByMatch,
			},
			include: {
				teamAmineSide: true,
				teamRobinSide: true
			}
		});

		return json(match as unknown as MatchFull, { status: 201 });
	} catch (err) {
		console.error('Error creating match', err);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
