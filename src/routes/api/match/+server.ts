import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';

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
		const data = finishedOnly
			? matches.filter((m) => m.winnerA || m.winnerB)
			: matches;
		return new Response(JSON.stringify(data), { status: 200 });
	} catch (err) {
		console.error('Error fetching matches', err);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
	}
};

// POST /api/match
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { teamAmine, teamRobin, numberOfShotByMatch } = await request.json();

		if (teamAmine.length === 0 || teamRobin.length === 0 || !numberOfShotByMatch) {
			return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
		}

		// Create the match
		const match = await prisma.match.create({
			data: {
				winnerA: false, // you can adjust later
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

		return new Response(JSON.stringify(match), { status: 201 });
	} catch (err) {
		console.error('Error creating match', err);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
	}
};
