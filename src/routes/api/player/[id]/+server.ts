import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const GET: RequestHandler = async ({ params }) => {
	const playerId = Number(params.id);

	// Fetch player
	const player = await prisma.player.findUnique({
		where: { id: playerId },
		select: {
			id: true,
			name: true,
			elo: true
		}
	});

	if (!player) {
		return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404 });
	}

	// Fetch matches where player participated
	const matches = await prisma.match.findMany({
		where: {
			OR: [{ teamAmineSide: { some: { playerId } } }, { teamRobinSide: { some: { playerId } } }]
		},
		orderBy: { createdAt: 'desc' },
		include: {
			teamAmineSide: { include: { player: true } },
			teamRobinSide: { include: { player: true } }
		}
	});

	let wins = 0;
	let losses = 0;

	// Format match data
	const recentMatches = matches
		.filter((match) => match.winnerA || match.winnerB)
		.map((match) => {
			const isOnTeamA = match.teamAmineSide.some((p) => p.playerId === playerId);
			const won = (isOnTeamA && match.winnerA) || (!isOnTeamA && match.winnerB);

			if (won) wins++;
			else losses++;

			// Opponents = players on the opposite team
			const opponents = isOnTeamA
				? match.teamRobinSide.map((p) => p.player)
				: match.teamAmineSide.map((p) => p.player);

			return {
				id: match.id,
				createdAt: match.createdAt,
				opponents,
				won
			};
		});

	const response = {
		...player,
		matchesPlayed: wins + losses,
		wins,
		losses,
		recentMatches
	};

	return new Response(JSON.stringify(response), { status: 200 });
};
