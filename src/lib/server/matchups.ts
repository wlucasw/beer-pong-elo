import prisma from '$lib/prisma';
import type { MatchupApiRow, MatchupResponse } from '$lib/types';

export async function computeMatchupsForPlayer(playerId: number): Promise<MatchupResponse> {
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

	// Fetch all shots in those matches for all players
	const allMatchShots = await prisma.shot.findMany({
		where: { matchId: { in: matchIds } },
		select: { playerId: true, matchId: true, hit: true }
	});

	const shotsByPlayerMatch = new Map<string, { hits: number; total: number }>();
	for (const s of allMatchShots) {
		const key = `${s.playerId}:${s.matchId}`;
		const agg = shotsByPlayerMatch.get(key) ?? { hits: 0, total: 0 };
		agg.total++;
		if (s.hit) agg.hits++;
		shotsByPlayerMatch.set(key, agg);
	}

	const byOpponentsMap = new Map<number, MatchupApiRow>();
	const byPartnersMap = new Map<number, MatchupApiRow>();

	const emptyRow = (id: number, name: string): MatchupApiRow => ({
		id,
		name,
		games: 0,
		wins: 0,
		losses: 0,
		shotsHit: 0,
		shotsTotal: 0,
		theirShotsHit: 0,
		theirShotsTotal: 0,
		theirGlobalAccuracyPct: 0,
		theirWinPercentVsUs: 0,
		theirGlobalWinPercent: 0
	});

	for (const m of matches) {
		const teamA = m.teamAmineSide;
		const teamB = m.teamRobinSide;
		const isOnTeamA = teamA.some((p) => p.playerId === playerId);
		const myTeam = isOnTeamA ? teamA : teamB;
		const oppTeam = isOnTeamA ? teamB : teamA;
		const won = (isOnTeamA && m.winnerA) || (!isOnTeamA && m.winnerB);
		const myShots = shotsByPlayerMatch.get(`${playerId}:${m.id}`) ?? { hits: 0, total: 0 };

		for (const opp of oppTeam) {
			if (!byOpponentsMap.has(opp.playerId)) {
				byOpponentsMap.set(opp.playerId, emptyRow(opp.playerId, opp.player.name));
			}
			const row = byOpponentsMap.get(opp.playerId)!;
			row.games += 1;
			if (won) row.wins += 1;
			else row.losses += 1;
			row.shotsHit += myShots.hits;
			row.shotsTotal += myShots.total;
			const oppShots = shotsByPlayerMatch.get(`${opp.playerId}:${m.id}`) ?? { hits: 0, total: 0 };
			row.theirShotsHit += oppShots.hits;
			row.theirShotsTotal += oppShots.total;
		}

		for (const mate of myTeam) {
			if (mate.playerId === playerId) continue;
			if (!byPartnersMap.has(mate.playerId)) {
				byPartnersMap.set(mate.playerId, emptyRow(mate.playerId, mate.player.name));
			}
			const row = byPartnersMap.get(mate.playerId)!;
			row.games += 1;
			if (won) row.wins += 1;
			else row.losses += 1;
			row.shotsHit += myShots.hits;
			row.shotsTotal += myShots.total;
			const mateShots = shotsByPlayerMatch.get(`${mate.playerId}:${m.id}`) ?? { hits: 0, total: 0 };
			row.theirShotsHit += mateShots.hits;
			row.theirShotsTotal += mateShots.total;
		}
	}

	// Fetch global statistics for all other players
	const allOtherIds = [
		...Array.from(byOpponentsMap.keys()),
		...Array.from(byPartnersMap.keys())
	];
	const globalStats = await prisma.statistics.findMany({
		where: { playerId: { in: [...new Set(allOtherIds)] } },
		select: { playerId: true, accuracy: true, wins: true, matchesPlayed: true }
	});
	const globalStatsMap = new Map(globalStats.map((s) => [s.playerId, s]));

	for (const [oppId, row] of byOpponentsMap) {
		const gs = globalStatsMap.get(oppId);
		row.theirGlobalAccuracyPct = gs ? gs.accuracy * 100 : 0;
		row.theirGlobalWinPercent =
			gs && gs.matchesPlayed > 0 ? (gs.wins / gs.matchesPlayed) * 100 : 0;
		// opponent's win rate against you = your losses / games
		row.theirWinPercentVsUs = row.games > 0 ? (row.losses / row.games) * 100 : 0;
	}

	for (const [partId, row] of byPartnersMap) {
		const gs = globalStatsMap.get(partId);
		row.theirGlobalAccuracyPct = gs ? gs.accuracy * 100 : 0;
		row.theirGlobalWinPercent =
			gs && gs.matchesPlayed > 0 ? (gs.wins / gs.matchesPlayed) * 100 : 0;
		// partner's win rate with you = same as your win rate with them
		row.theirWinPercentVsUs = row.games > 0 ? (row.wins / row.games) * 100 : 0;
	}

	const sortByGamesDesc = (a: MatchupApiRow, b: MatchupApiRow) => b.games - a.games;

	return {
		byOpponents: Array.from(byOpponentsMap.values()).sort(sortByGamesDesc),
		byPartners: Array.from(byPartnersMap.values()).sort(sortByGamesDesc)
	};
}
