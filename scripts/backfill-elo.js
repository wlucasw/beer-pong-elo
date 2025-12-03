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

	console.log('Elo backfill complete.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
