import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import type { MatchFull } from '$lib/types';

// GET /api/match?finished=1
export const GET: RequestHandler = async ({ url }) => {
	try {
		const finishedOnly = url.searchParams.has('finished');
		const matches = await prisma.match.findMany({
			orderBy: { createdAt: 'desc' },
			include: {
				teamAmineSide: { include: { player: true } },
				teamRobinSide: { include: { player: true } }
			}
		});
		const data = (finishedOnly ? matches.filter((m) => m.winnerA || m.winnerB) : matches) as unknown as MatchFull[];
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
