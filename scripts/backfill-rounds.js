import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillMatch(match) {
	const allShots = await prisma.shot.findMany({
		where: { matchId: match.id }
	});

	if (allShots.length === 0) return 0;

	const shotsA = allShots.filter((s) => s.team === 'A').sort((a, b) => a.sequence - b.sequence);
	const shotsB = allShots.filter((s) => s.team === 'B').sort((a, b) => a.sequence - b.sequence);

	// The team whose first shot was recorded earliest goes first
	const firstA = shotsA[0];
	const firstB = shotsB[0];
	let currentTeam =
		!firstA ? 'B'
		: !firstB ? 'A'
		: firstA.createdAt <= firstB.createdAt ? 'A' : 'B';

	let idxA = 0;
	let idxB = 0;

	let currentRound = 0;
	let isCounter = false;
	let numberToCounter = 0;
	let isToBeCounter = false;
	let numberToBeCountered = 0;
	let areAllShotsInRoundHits = true;
	let numberOfShotsInCurrentRound = 0;
	let hasWinner = false;

	// Cumulative hits per team (bounce = 2 hits)
	const teamHits = { A: 0, B: 0 };

	const updates = [];

	while (idxA < shotsA.length || idxB < shotsB.length) {
		const teamShots = currentTeam === 'A' ? shotsA : shotsB;
		const idx = currentTeam === 'A' ? idxA : idxB;

		if (idx >= teamShots.length) {
			currentTeam = currentTeam === 'A' ? 'B' : 'A';
			continue;
		}

		const shot = teamShots[idx];
		if (currentTeam === 'A') idxA++; else idxB++;

		const shotRound = currentRound;
		const shotIsCounter = isCounter;

		areAllShotsInRoundHits = shot.hit && areAllShotsInRoundHits;
		numberOfShotsInCurrentRound += 1;

		if (shot.hit) {
			teamHits[currentTeam] += shot.bounceCup != null ? 2 : 1;
		}

		if (shot.hit && numberToCounter > 0) {
			numberToCounter -= 1;
			if (numberToCounter === 0) isCounter = false;
		}
		if (shot.hit && teamHits[currentTeam] >= 10) {
			isToBeCounter = true;
			numberToBeCountered += 1;
		}

		const roundAdvanced =
			(isToBeCounter && numberToBeCountered >= match.numberOfShotByMatch) ||
			(!areAllShotsInRoundHits && numberOfShotsInCurrentRound >= match.numberOfShotByMatch) ||
			match.numberOfShotByMatch === 1;

		if (roundAdvanced) {
			if (numberToCounter > 0) hasWinner = true;

			const nextTeam = currentTeam === 'A' ? 'B' : 'A';
			const nextIdx = nextTeam === 'A' ? idxA : idxB;
			const nextTeamShots = nextTeam === 'A' ? shotsA : shotsB;
			if (!hasWinner && nextIdx >= nextTeamShots.length) {
				throw new Error(`round advanced to team ${nextTeam} but their shot array is empty`);
			}

			currentRound += 1;
			areAllShotsInRoundHits = true;
			numberOfShotsInCurrentRound = 0;
			isCounter = isToBeCounter;
			isToBeCounter = false;
			numberToCounter = numberToBeCountered;
			numberToBeCountered = 0;
			currentTeam = nextTeam;
		}

		updates.push(
			prisma.shot.update({
				where: { id: shot.id },
				data: { round: shotRound, isCounter: shotIsCounter }
			})
		);
	}

	if (!hasWinner) {
		throw new Error('match ended with no winner (no counter was left unanswered)');
	}

	await prisma.$transaction(updates);
	return updates.length;
}

async function main() {
	console.log('Starting round/isCounter backfill...');

	const matches = await prisma.match.findMany({
		where: { status: 'FINISHED', numberOfShotByMatch: { gte: 0 } },
		orderBy: { createdAt: 'asc' }
	});

	console.log(`Found ${matches.length} finished matches.`);

	let totalShots = 0;
	const noWinnerIds = [];
	const emptyTeamIds = [];
	for (const match of matches) {
		const maxPlayerByTeam = Math.max(await prisma.matchTeamA.count({
			where: { matchId: match.id },
		}), await prisma.matchTeamB.count({
			where: { matchId: match.id },
		}));
		await prisma.match.update({
			where: { id: match.id },
			data: { numberOfShotByMatch: Math.max(maxPlayerByTeam,2) }
		});
		match.numberOfShotByMatch = Math.max(maxPlayerByTeam,2);
		try {
			const count = await backfillMatch(match);
			console.log(`Match ${match.id}: updated ${count} shots`);
			totalShots += count;
		} catch (e) {
			console.error(`Match ${match.id}: backfill failed — ${e.message}`);
			await prisma.$transaction([
				prisma.shot.updateMany({
					where: { matchId: match.id },
					data: { isCounter: false, round: -1 }
				}),
				prisma.match.update({
					where: { id: match.id },
					data: { numberOfShotByMatch: -1 }
				})
			]);
			console.warn(`Match ${match.id}: shots reset and numberOfShotByMatch set to -1`);
			if (e.message.includes('no winner')) noWinnerIds.push(match.id);
			else emptyTeamIds.push(match.id);
		}
	}

	const failedCount = noWinnerIds.length + emptyTeamIds.length;
	console.log(
		`\nBackfill complete. Updated ${totalShots} shots across ${matches.length - failedCount} matches. ${failedCount} failed.`
	);
	if (noWinnerIds.length > 0)
		console.log(`  No winner (${noWinnerIds.length}): ${noWinnerIds.join(', ')}`);
	if (emptyTeamIds.length > 0)
		console.log(`  Empty team on switch (${emptyTeamIds.length}): ${emptyTeamIds.join(', ')}`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
