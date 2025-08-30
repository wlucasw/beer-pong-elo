import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';

// POST /api/match
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { teamAmine, teamRobin, ballNumber } = await request.json();

		if (teamAmine.length === 0 || teamRobin.length === 0 || !ballNumber) {
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
				}
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
