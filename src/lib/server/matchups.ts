import prisma from '$lib/prisma';

export type MatchupStats = {
	id: number;
	name: string;
	games: number;
	wins: number;
	losses: number;
	shotsHit: number;
	shotsTotal: number;
};

export async function computeMatchupsForPlayer(playerId: number): Promise<{
	byOpponents: MatchupStats[];
	byPartners: MatchupStats[];
}> {
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

	if (matches.length === 0) {
		return { byOpponents: [], byPartners: [] };
	}

	const matchIds = matches.map((m) => m.id);
	const myShots = await prisma.shot.findMany({
		where: {
			playerId,
			matchId: { in: matchIds }
		},
		select: {
			matchId: true,
			hit: true
		}
	});
	const myShotsByMatch = new Map<number, { hits: number; total: number }>();
	for (const s of myShots) {
		const agg = myShotsByMatch.get(s.matchId) ?? { hits: 0, total: 0 };
		agg.total += 1;
		if (s.hit) agg.hits += 1;
		myShotsByMatch.set(s.matchId, agg);
	}

	const byOpponentsMap = new Map<number, MatchupStats>();
	const byPartnersMap = new Map<number, MatchupStats>();

	for (const m of matches) {
		const teamA = m.teamAmineSide;
		const teamB = m.teamRobinSide;
		const isOnTeamA = teamA.some((p) => p.playerId === playerId);
		const myTeam = isOnTeamA ? teamA : teamB;
		const oppTeam = isOnTeamA ? teamB : teamA;
		const won = (isOnTeamA && m.winnerA) || (!isOnTeamA && m.winnerB);
		const shotAgg = myShotsByMatch.get(m.id) ?? { hits: 0, total: 0 };

		for (const opp of oppTeam) {
			if (!byOpponentsMap.has(opp.playerId)) {
				byOpponentsMap.set(opp.playerId, {
					id: opp.playerId,
					name: opp.player.name,
					games: 0,
					wins: 0,
					losses: 0,
					shotsHit: 0,
					shotsTotal: 0
				});
			}
			const s = byOpponentsMap.get(opp.playerId)!;
			s.games += 1;
			if (won) s.wins += 1;
			else s.losses += 1;
			s.shotsHit += shotAgg.hits;
			s.shotsTotal += shotAgg.total;
		}

		for (const mate of myTeam) {
			if (mate.playerId === playerId) continue;
			if (!byPartnersMap.has(mate.playerId)) {
				byPartnersMap.set(mate.playerId, {
					id: mate.playerId,
					name: mate.player.name,
					games: 0,
					wins: 0,
					losses: 0,
					shotsHit: 0,
					shotsTotal: 0
				});
			}
			const s = byPartnersMap.get(mate.playerId)!;
			s.games += 1;
			if (won) s.wins += 1;
			else s.losses += 1;
			s.shotsHit += shotAgg.hits;
			s.shotsTotal += shotAgg.total;
		}
	}

	const sortByGamesDesc = (a: MatchupStats, b: MatchupStats) => b.games - a.games;

	return {
		byOpponents: Array.from(byOpponentsMap.values()).sort(sortByGamesDesc),
		byPartners: Array.from(byPartnersMap.values()).sort(sortByGamesDesc)
	};
}
