import prisma from '$lib/prisma';

export async function recalculateRounds(matchId: number, numberOfShotByMatch: number): Promise<number> {
	const allShots = await prisma.shot.findMany({ where: { matchId } });

	if (allShots.length === 0) return 0;

	const shotsA = allShots.filter((s) => s.team === 'A').sort((a, b) => a.sequence - b.sequence);
	const shotsB = allShots.filter((s) => s.team === 'B').sort((a, b) => a.sequence - b.sequence);

	const firstA = shotsA[0];
	const firstB = shotsB[0];
	let currentTeam: 'A' | 'B' =
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
	const teamHits: Record<'A' | 'B', number> = { A: 0, B: 0 };

	const updates: ReturnType<typeof prisma.shot.update>[] = [];

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
			(isToBeCounter && numberToBeCountered >= numberOfShotByMatch) ||
			(!areAllShotsInRoundHits && numberOfShotsInCurrentRound >= numberOfShotByMatch) ||
			numberOfShotByMatch === 1;

		if (roundAdvanced) {
			if (numberToCounter > 0) hasWinner = true;

			const nextTeam: 'A' | 'B' = currentTeam === 'A' ? 'B' : 'A';
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
