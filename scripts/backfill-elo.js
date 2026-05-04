import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Elo calculation with cups remaining (same as API)
function calculateElo(
	playerElo,
	opponentElo,
	{ didWin, playerCupsRemaining, opponentCupsRemaining, k = 120 }
) {
	const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
	const outcome = didWin ? 1 : 0;
	const margin = Math.abs(playerCupsRemaining - opponentCupsRemaining) / 10;
	return Math.round(k * (outcome - expected) * (0.6 + 0.4 * margin));
}

async function computeOpponentsAccuracyDiff(playerId) {
	const matches = await prisma.match.findMany({
		where: {
			status: 'FINISHED',
			OR: [{ teamAmineSide: { some: { playerId } } }, { teamRobinSide: { some: { playerId } } }]
		},
		include: {
			teamAmineSide: true,
			teamRobinSide: true
		}
	});
	if (matches.length === 0) return 0;
	const matchIds= [];
	const opponentIdsSet = new Set();
	for (const m of matches) {
		matchIds.push(m.id);
		const isOnA = m.teamAmineSide.some((t) => t.playerId === playerId);
		const opponents = isOnA ? m.teamRobinSide : m.teamAmineSide;
		for (const o of opponents) opponentIdsSet.add(o.playerId);
	}
	const opponentIds = Array.from(opponentIdsSet);
	if (opponentIds.length === 0) return 0;

	const allOpponentsShots = await prisma.shot.findMany({
		where: { playerId: { in: opponentIds } },
		select: { playerId: true, hit: true }
	});
	const allOpponentsAccuracy = new Map();
	for (const s of allOpponentsShots) {
		const agg = allOpponentsAccuracy.get(s.playerId) ?? { hits: 0, total: 0 };
		agg.total += 1;
		if (s.hit) agg.hits += 1;
		allOpponentsAccuracy.set(s.playerId, agg);
	}

	const shotOfOpponentVersusPlayer = await prisma.shot.findMany({
		where: { matchId: { in: matchIds }, playerId: { in: opponentIds } },
		select: { playerId: true, hit: true, matchId: true }
	});

	const allMatchPlayedIds = shotOfOpponentVersusPlayer.map((s) => s.matchId);
	const allMatchShotsAndHitsByOpponent = new Map();
	for (const matchId of allMatchPlayedIds) {
		const listOfShotsAndHitsByOpponent = allMatchShotsAndHitsByOpponent.get(matchId) ?? new Map();
		for (const s of shotOfOpponentVersusPlayer) {
			const agg = listOfShotsAndHitsByOpponent.get(s.playerId) ?? { hits: 0, total: 0 };
			agg.total += 1;
			if (s.hit) agg.hits += 1;
			listOfShotsAndHitsByOpponent.set(s.playerId, agg);
		}
		allMatchShotsAndHitsByOpponent.set(matchId, listOfShotsAndHitsByOpponent);
	}
	
	let accuracyDifferencesSum = 0;
	let sumOfPseudoMatches = 0;
	for (const matchId of allMatchPlayedIds) {
		for (const oppId of opponentIds) {
			const consideredShots = allMatchShotsAndHitsByOpponent.get(matchId)?.get(oppId) ?? { hits: 0, total: 0 };
			const opponentGlobalShots = allOpponentsAccuracy.get(oppId);
			if (!consideredShots || !opponentGlobalShots || consideredShots.total === 0 || opponentGlobalShots.total === 0) continue;
			const accuracyConsidered = consideredShots.hits / consideredShots.total;
			const accuracyGlobal = opponentGlobalShots.hits / opponentGlobalShots.total;
			const accuracyDifference =  accuracyConsidered - accuracyGlobal;
			accuracyDifferencesSum += accuracyDifference;
			sumOfPseudoMatches += 1;
		}
	}
	return accuracyDifferencesSum === 0 ? 0 : accuracyDifferencesSum / sumOfPseudoMatches;
}

async function upsertPlayerStatistics(playerId) {
	const [totalShots, hits, bounceShots, matchesPlayed, wins, counterShots, counterHits] = await Promise.all([
		prisma.shot.count({ where: { playerId } }),
		prisma.shot.count({ where: { playerId, hit: true } }),
		prisma.shot.count({ where: { playerId, bounceCup: { not: null } } }),
		prisma.match.count({
			where: {
				status: 'FINISHED',
				OR: [{ teamAmineSide: { some: { playerId } } }, { teamRobinSide: { some: { playerId } } }]
			}
		}),
		prisma.match.count({
			where: {
				status: 'FINISHED',
				OR: [
					{ AND: [{ teamAmineSide: { some: { playerId } } }, { winnerA: true }] },
					{ AND: [{ teamRobinSide: { some: { playerId } } }, { winnerB: true }] }
				]
			}
		}),
			prisma.shot.count({ where: { playerId, isCounter: true } }),
		prisma.shot.count({ where: { playerId, isCounter: true, hit: true } })
	]);
	const losses = Math.max(0, matchesPlayed - wins);
	const accuracy = totalShots === 0 ? 0 : hits / totalShots;
	const opponentsAccuracyDiff = await computeOpponentsAccuracyDiff(playerId);
	const counterAccuracy = counterShots === 0 ? 0 : (counterHits / counterShots);

	await prisma.$executeRaw`
		INSERT INTO "Statistics" ("playerId","accuracy","matchesPlayed","wins","losses","bounceShots","opponentsAccuracyDiff","counterAccuracy")
		VALUES (${playerId}, ${accuracy}, ${matchesPlayed}, ${wins}, ${losses}, ${bounceShots}, ${opponentsAccuracyDiff}, ${counterAccuracy})
		ON CONFLICT ("playerId") DO UPDATE SET
			"accuracy" = EXCLUDED."accuracy",
			"matchesPlayed" = EXCLUDED."matchesPlayed",
			"wins" = EXCLUDED."wins",
			"losses" = EXCLUDED."losses",
			"bounceShots" = EXCLUDED."bounceShots",
			"opponentsAccuracyDiff" = EXCLUDED."opponentsAccuracyDiff",
			"counterAccuracy" = EXCLUDED."counterAccuracy"
	`;
}

async function main() {
	console.log('Starting Elo backfill...');

	// Build in-memory elo map; everyone starts at 1000
	const players = await prisma.player.findMany({ select: { id: true } });
	const playerIdToElo = new Map(players.map((p) => [p.id, 1000]));

	// Process only finished matches, in chronological order
	const matches = await prisma.match.findMany({
		where: { status: 'FINISHED' },
		orderBy: { createdAt: 'asc' },
		include: {
			teamAmineSide: true,
			teamRobinSide: true
		}
	});

	for (const match of matches) {
		const teamAIds = match.teamAmineSide.map((t) => t.playerId);
		const teamBIds = match.teamRobinSide.map((t) => t.playerId);

		if (teamAIds.length === 0 || teamBIds.length === 0) {
			console.warn(`Skipping match ${match.id} due to empty team.`);
			continue;
		}

		const teamAElo =
			teamAIds.reduce((sum, id) => sum + (playerIdToElo.get(id) ?? 1000), 0) / teamAIds.length;
		const teamBElo =
			teamBIds.reduce((sum, id) => sum + (playerIdToElo.get(id) ?? 1000), 0) / teamBIds.length;

		const shots = await prisma.shot.findMany({
			where: { matchId: match.id },
			select: { hit: true, bounceCup: true, team: true }
		});

		const shotWithHitTeamA = shots.filter((s) => s.hit && s.team === 'A');
		const shotWithHitTeamB = shots.filter((s) => s.hit && s.team === 'B');
		const shotWithBounceTeamA = shots.filter((s) => s.bounceCup != null && s.team === 'A');
		const shotWithBounceTeamB = shots.filter((s) => s.bounceCup != null && s.team === 'B');

		const teamBRemainingCups = 10 - shotWithHitTeamA.length - shotWithBounceTeamA.length;
		const teamARemainingCups = 10 - shotWithHitTeamB.length - shotWithBounceTeamB.length;

		const teamAScore = match.winnerA ? 1 : 0;
		const teamBScore = match.winnerB ? 1 : 0;

		const eloVariationTeamA = calculateElo(teamAElo, teamBElo, {
			didWin: teamAScore === 1,
			playerCupsRemaining: teamARemainingCups,
			opponentCupsRemaining: teamBRemainingCups
		});
		const eloVariationTeamB = calculateElo(teamBElo, teamAElo, {
			didWin: teamBScore === 1,
			playerCupsRemaining: teamBRemainingCups,
			opponentCupsRemaining: teamARemainingCups
		});

		await prisma.match.update({
			where: { id: match.id },
			data: {
				eloVariationTeamA,
				eloVariationTeamB
			}
		});

		for (const id of teamAIds) {
			playerIdToElo.set(id, (playerIdToElo.get(id) ?? 1000) + eloVariationTeamA);
		}
		for (const id of teamBIds) {
			playerIdToElo.set(id, (playerIdToElo.get(id) ?? 1000) + eloVariationTeamB);
		}
	}

	// Persist final ELOs
	const updates = [];
	for (const [playerId, elo] of playerIdToElo.entries()) {
		updates.push(
			prisma.player.update({
				where: { id: playerId },
				data: { elo: Math.round(elo) }
			})
		);
	}
	await prisma.$transaction(updates);

	console.log('Elo backfill complete. Recomputing Statistics...');

	// Recompute and upsert Statistics for all players
	const allPlayers = await prisma.player.findMany({ select: { id: true } });
	await Promise.all(allPlayers.map((p) => upsertPlayerStatistics(p.id)));

	console.log('Statistics backfill complete.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
