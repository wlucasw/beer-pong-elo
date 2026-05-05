import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type {
	HallOfFameData,
	HallOfFameDuoEntry,
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

	const MIN_GAMES_FOR_DUO = MIN_GAMES_FOR_CAREER_STAT;

	const duoStatsRaw = await prisma.$queryRaw<Array<{
		player1Id: number;
		player2Id: number;
		player1Name: string;
		player2Name: string;
		games: bigint;
		wins: bigint;
		totalShots: bigint;
		hitShots: bigint;
		player1WinRate: number;
		player2WinRate: number;
		player1Accuracy: number;
		player2Accuracy: number;
	}>>`
		WITH duo_games AS (
			SELECT LEAST(ta1."playerId", ta2."playerId") AS player1Id,
			       GREATEST(ta1."playerId", ta2."playerId") AS player2Id,
			       ta1."matchId", m."winnerA" AS won
			FROM "MatchTeamA" ta1
			JOIN "MatchTeamA" ta2 ON ta1."matchId" = ta2."matchId" AND ta1."playerId" < ta2."playerId"
			JOIN "Match" m ON m.id = ta1."matchId" AND m.status = 'FINISHED'
			UNION ALL
			SELECT LEAST(tb1."playerId", tb2."playerId"),
			       GREATEST(tb1."playerId", tb2."playerId"),
			       tb1."matchId", m."winnerB"
			FROM "MatchTeamB" tb1
			JOIN "MatchTeamB" tb2 ON tb1."matchId" = tb2."matchId" AND tb1."playerId" < tb2."playerId"
			JOIN "Match" m ON m.id = tb1."matchId" AND m.status = 'FINISHED'
		),
		duo_with_shots AS (
			SELECT dg.player1Id, dg.player2Id, dg."matchId", dg.won,
			       COUNT(s.id) AS totalShots,
			       SUM(CASE WHEN s.hit THEN 1 ELSE 0 END) AS hitShots
			FROM duo_games dg
			LEFT JOIN "Shot" s ON s."matchId" = dg."matchId"
			    AND (s."playerId" = dg.player1Id OR s."playerId" = dg.player2Id)
			GROUP BY dg.player1Id, dg.player2Id, dg."matchId", dg.won
		),
		duo_agg AS (
			SELECT player1Id, player2Id,
			       COUNT(*)::int AS games,
			       SUM(CASE WHEN won THEN 1 ELSE 0 END)::int AS wins,
			       SUM(totalShots)::int AS totalShots,
			       SUM(hitShots)::int AS hitShots
			FROM duo_with_shots
			GROUP BY player1Id, player2Id
			HAVING COUNT(*) >= ${MIN_GAMES_FOR_DUO}
		)
		SELECT da.player1Id AS "player1Id", da.player2Id AS "player2Id",
		       p1.name AS "player1Name", p2.name AS "player2Name",
		       da.games, da.wins, da.totalShots AS "totalShots", da.hitShots AS "hitShots",
		       CASE WHEN s1."matchesPlayed" > 0 THEN s1.wins::float / s1."matchesPlayed" ELSE 0 END AS "player1WinRate",
		       CASE WHEN s2."matchesPlayed" > 0 THEN s2.wins::float / s2."matchesPlayed" ELSE 0 END AS "player2WinRate",
		       s1.accuracy AS "player1Accuracy",
		       s2.accuracy AS "player2Accuracy"
		FROM duo_agg da
		JOIN "Player" p1 ON p1.id = da.player1Id
		JOIN "Player" p2 ON p2.id = da.player2Id
		JOIN "Statistics" s1 ON s1."playerId" = da.player1Id
		JOIN "Statistics" s2 ON s2."playerId" = da.player2Id
	`;

	type DuoRow = (typeof duoStatsRaw)[number] & { winRateDelta: number; accuracyDelta: number };

	const duoRows: DuoRow[] = duoStatsRaw.map((r) => {
		const games = Number(r.games);
		const wins = Number(r.wins);
		const totalShots = Number(r.totalShots);
		const hitShots = Number(r.hitShots);
		const duoWinRate = wins / games;
		const duoAccuracy = totalShots > 0 ? hitShots / totalShots : 0;
		const avgWinRate = (r.player1WinRate + r.player2WinRate) / 2;
		const avgAccuracy = (r.player1Accuracy + r.player2Accuracy) / 2;
		return {
			...r,
			games: BigInt(games),
			winRateDelta: duoWinRate - avgWinRate,
			accuracyDelta: duoAccuracy - avgAccuracy
		};
	});

	const toDuoEntry = (r: DuoRow, rank: number, delta: number): HallOfFameDuoEntry => ({
		rank,
		player1Id: r.player1Id,
		player1Name: r.player1Name,
		player2Id: r.player2Id,
		player2Name: r.player2Name,
		games: Number(r.games),
		valuePct: Math.round(delta * 1000) / 10
	});

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
		),
		bestDuoWinRate: [...duoRows]
			.sort((a, b) => b.winRateDelta - a.winRateDelta)
			.slice(0, 3)
			.map((r, i) => toDuoEntry(r, i + 1, r.winRateDelta)),
		worstDuoWinRate: [...duoRows]
			.sort((a, b) => a.winRateDelta - b.winRateDelta)
			.slice(0, 3)
			.map((r, i) => toDuoEntry(r, i + 1, r.winRateDelta)),
		bestDuoAccuracy: [...duoRows]
			.sort((a, b) => b.accuracyDelta - a.accuracyDelta)
			.slice(0, 3)
			.map((r, i) => toDuoEntry(r, i + 1, r.accuracyDelta)),
		worstDuoAccuracy: [...duoRows]
			.sort((a, b) => a.accuracyDelta - b.accuracyDelta)
			.slice(0, 3)
			.map((r, i) => toDuoEntry(r, i + 1, r.accuracyDelta))
	};

	return json(response);
};
