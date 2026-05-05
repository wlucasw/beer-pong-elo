import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type {
	HallOfFameData,
	HallOfFameMatchEntry,
	HallOfFamePlayerEntry,
	HallOfFamePlayerMatchEntry
} from '$lib/types';

const MIN_GAMES_FOR_CAREER_STAT = 3;
const MIN_SHOTS_FOR_SINGLE_GAME_ACCURACY = 5;

export const GET: RequestHandler = async () => {
	const [
		longestGamesRaw,
		shortestGamesRaw,
		mostCountersInGameRaw,
		mostCountersScoredRaw,
		allMatchesForElo,
		bestCounterAccuracyRaw,
		allStatsForBounce
	] = await Promise.all([
		prisma.$queryRaw<Array<{ matchId: number; total: bigint }>>`
			SELECT s."matchId", COUNT(*) as total
			FROM "Shot" s
			JOIN "Match" m ON m.id = s."matchId"
			WHERE m.status = 'FINISHED'
			GROUP BY s."matchId"
			ORDER BY total DESC
			LIMIT 3
		`,
		prisma.$queryRaw<Array<{ matchId: number; total: bigint }>>`
			SELECT s."matchId", COUNT(*) as total
			FROM "Shot" s
			JOIN "Match" m ON m.id = s."matchId"
			WHERE m.status = 'FINISHED'
			GROUP BY s."matchId"
			ORDER BY total ASC
			LIMIT 3
		`,
		prisma.shot.groupBy({
			by: ['matchId'],
			where: { isCounter: true, hit: true },
			_count: { id: true },
			orderBy: { _count: { id: 'desc' } },
			take: 3
		}),
		prisma.shot.groupBy({
			by: ['playerId', 'matchId'],
			where: { isCounter: true, hit: true },
			_count: { id: true },
			orderBy: { _count: { id: 'desc' } },
			take: 3
		}),
		prisma.match.findMany({
			where: { status: 'FINISHED', eloVariationTeamA: { not: null } },
			select: {
				id: true,
				createdAt: true,
				eloVariationTeamA: true,
				winnerA: true,
				teamAmineSide: { include: { player: { select: { name: true } } } },
				teamRobinSide: { include: { player: { select: { name: true } } } }
			}
		}),
		prisma.statistics.findMany({
			where: { matchesPlayed: { gte: MIN_GAMES_FOR_CAREER_STAT }, counterAccuracy: { gt: 0 } },
			include: { player: { select: { id: true, name: true } } },
			orderBy: { counterAccuracy: 'desc' },
			take: 3
		}),
		prisma.statistics.findMany({
			where: { matchesPlayed: { gte: MIN_GAMES_FOR_CAREER_STAT } },
			include: { player: { select: { id: true, name: true } } }
		})
	]);

	const bestSingleGameAccuracyRaw = await prisma.$queryRaw<
		Array<{
			playerId: number;
			matchId: number;
			playerName: string;
			createdAt: Date;
			total: bigint;
			hits: bigint;
			accuracy: number;
		}>
	>`
		SELECT s."playerId", s."matchId", p.name as "playerName", m."createdAt",
			COUNT(*) as total,
			SUM(CASE WHEN s.hit THEN 1 ELSE 0 END) as hits,
			SUM(CASE WHEN s.hit THEN 1 ELSE 0 END)::float / COUNT(*) as accuracy
		FROM "Shot" s
		JOIN "Match" m ON m.id = s."matchId"
		JOIN "Player" p ON p.id = s."playerId"
		WHERE s."isCounter" = false AND m.status = 'FINISHED'
		GROUP BY s."playerId", s."matchId", p.name, m."createdAt"
		HAVING COUNT(*) >= ${MIN_SHOTS_FOR_SINGLE_GAME_ACCURACY}
		ORDER BY accuracy DESC
		LIMIT 3
	`;

	const longestShortestMatchIds = [
		...longestGamesRaw.map((g) => g.matchId),
		...shortestGamesRaw.map((g) => g.matchId)
	];
	const counterMatchIds = mostCountersInGameRaw.map((g) => g.matchId);
	const [gameDurationMatchDetails, counterMatchDetails, counterScoredPlayers, counterScoredMatches] = await Promise.all([
		prisma.match.findMany({
			where: { id: { in: longestShortestMatchIds } },
			include: {
				teamAmineSide: { include: { player: { select: { name: true } } } },
				teamRobinSide: { include: { player: { select: { name: true } } } }
			}
		}),
		prisma.match.findMany({
			where: { id: { in: counterMatchIds } },
			include: {
				teamAmineSide: { include: { player: { select: { name: true } } } },
				teamRobinSide: { include: { player: { select: { name: true } } } }
			}
		}),
		prisma.player.findMany({
			where: { id: { in: mostCountersScoredRaw.map((g) => g.playerId) } },
			select: { id: true, name: true }
		}),
		prisma.match.findMany({
			where: { id: { in: mostCountersScoredRaw.map((g) => g.matchId) } },
			select: { id: true, createdAt: true }
		})
	]);

	const sortedEloSwings = [...allMatchesForElo]
		.sort((a, b) => Math.abs(b.eloVariationTeamA!) - Math.abs(a.eloVariationTeamA!))
		.slice(0, 3);

	const mostBouncesPerGame = [...allStatsForBounce]
		.map((s) => ({ ...s, bouncesPerGame: s.matchesPlayed > 0 ? s.bounceShots / s.matchesPlayed : 0 }))
		.sort((a, b) => b.bouncesPerGame - a.bouncesPerGame)
		.slice(0, 3);

	const toMatchEntry = (
		m: { id: number; createdAt: Date; winnerA: boolean; teamAmineSide: { player: { name: string } }[]; teamRobinSide: { player: { name: string } }[] },
		value: number,
		rank: number
	): HallOfFameMatchEntry => ({
		rank,
		matchId: m.id,
		value,
		createdAt: m.createdAt.toISOString(),
		teamA: m.teamAmineSide.map((e) => e.player.name),
		teamB: m.teamRobinSide.map((e) => e.player.name),
		winnerA: m.winnerA
	});

	const response: HallOfFameData = {
		longestGames: longestGamesRaw.map((g, i) => {
			const match = gameDurationMatchDetails.find((m) => m.id === g.matchId)!;
			return toMatchEntry(match, Number(g.total), i + 1);
		}),
		shortestGames: shortestGamesRaw.map((g, i) => {
			const match = gameDurationMatchDetails.find((m) => m.id === g.matchId)!;
			return toMatchEntry(match, Number(g.total), i + 1);
		}),
		mostBouncesPerGame: mostBouncesPerGame.map(
			(s, i): HallOfFamePlayerEntry => ({
				rank: i + 1,
				playerId: s.player.id,
				playerName: s.player.name,
				value: Math.round(s.bouncesPerGame * 100) / 100
			})
		),
		mostCountersInGame: mostCountersInGameRaw.map((g, i): HallOfFameMatchEntry => {
			const match = counterMatchDetails.find((m) => m.id === g.matchId)!;
			return {
				rank: i + 1,
				matchId: g.matchId,
				value: g._count.id,
				createdAt: match.createdAt.toISOString(),
				teamA: match.teamAmineSide.map((e) => e.player.name),
				teamB: match.teamRobinSide.map((e) => e.player.name),
				winnerA: match.winnerA
			};
		}),
		mostCountersScoredInGame: mostCountersScoredRaw.map((g, i): HallOfFamePlayerMatchEntry => {
			const player = counterScoredPlayers.find((p) => p.id === g.playerId)!;
			const match = counterScoredMatches.find((m) => m.id === g.matchId)!;
			return {
				rank: i + 1,
				playerId: g.playerId,
				playerName: player.name,
				matchId: g.matchId,
				createdAt: match.createdAt.toISOString(),
				value: g._count.id
			};
		}),
		biggestEloSwings: sortedEloSwings.map((m, i) =>
			toMatchEntry(m as any, Math.abs(m.eloVariationTeamA!), i + 1)
		),
		bestCounterAccuracy: bestCounterAccuracyRaw.map(
			(s, i): HallOfFamePlayerEntry => ({
				rank: i + 1,
				playerId: s.player.id,
				playerName: s.player.name,
				value: Math.round(s.counterAccuracy * 1000) / 10
			})
		),
		bestSingleGameAccuracy: bestSingleGameAccuracyRaw.map(
			(row, i): HallOfFamePlayerMatchEntry => ({
				rank: i + 1,
				playerId: row.playerId,
				playerName: row.playerName,
				matchId: row.matchId,
				createdAt: row.createdAt.toISOString(),
				value: Math.round(row.accuracy * 1000) / 10
			})
		)
	};

	return json(response);
};
