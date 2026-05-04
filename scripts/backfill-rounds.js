import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillMatch(match) {
	const shots = await prisma.shot.findMany({
		where: { matchId: match.id },
		orderBy: { createdAt: 'asc' }
	});

	if (shots.length === 0) return 0;

	let currentRound = 0;
	let isCounter = false;
	let numberToCounter = 0;
	let isToBeCounter = false;
	let numberToBeCountered = 0;
	let areAllShotsInRoundHits = true;
	let numberOfShotsInCurrentRound = 0;

	// Cumulative hits per team (bounce = 2 hits)
	const teamHits = { A: 0, B: 0 };

	const updates = [];

	for (const shot of shots) {
		const team = shot.team;

		// Capture state before advancing — this is what gets written to the shot
		const shotRound = currentRound;
		const shotIsCounter = isCounter;

		areAllShotsInRoundHits = shot.hit && areAllShotsInRoundHits;
		numberOfShotsInCurrentRound += 1;

		if (shot.hit) {
			teamHits[team] += shot.bounceCup != null ? 2 : 1;
		}

		if (shot.hit && numberToCounter > 0) {
			numberToCounter -= 1;
			if (numberToCounter === 0) isCounter = false;
		}
		if (shot.hit && teamHits[team] >= 10) {
			isToBeCounter = true;
			numberToBeCountered += 1;
		}

		if (
			(isToBeCounter && numberToBeCountered >= match.numberOfShotByMatch) ||
			(!areAllShotsInRoundHits && numberOfShotsInCurrentRound >= match.numberOfShotByMatch) ||
			match.numberOfShotByMatch === 1
		) {
			currentRound += 1;
			areAllShotsInRoundHits = true;
			numberOfShotsInCurrentRound = 0;
			isCounter = isToBeCounter;
			isToBeCounter = false;
			numberToCounter = numberToBeCountered;
			numberToBeCountered = 0;
		}

		updates.push(
			prisma.shot.update({
				where: { id: shot.id },
				data: { round: shotRound, isCounter: shotIsCounter }
			})
		);
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
	let failedMatches = 0;
	for (const match of matches) {
		try {
			const count = await backfillMatch(match);
			console.log(`Match ${match.id}: updated ${count} shots`);
			totalShots += count;
		} catch (e) {
			console.error(`Match ${match.id}: backfill failed — ${e.message}`);
			await prisma.match.update({
				where: { id: match.id },
				data: { numberOfShotByMatch: -1 }
			});
			console.warn(`Match ${match.id}: numberOfShotByMatch set to -1`);
			failedMatches += 1;
		}
	}

	console.log(
		`Backfill complete. Updated ${totalShots} shots across ${matches.length - failedMatches} matches. ${failedMatches} failed.`
	);
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
