import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('Deleting all ongoing matches and their related entries...');

	// Find ongoing matches
	const ongoingMatches = await prisma.match.findMany({
		where: { status: 'ONGOING' },
		select: { id: true }
	});

	if (ongoingMatches.length === 0) {
		console.log('No ongoing matches found. Nothing to delete.');
		return;
	}

	const matchIds = ongoingMatches.map((m) => m.id);
	console.log(`Found ${matchIds.length} ongoing matches: [${matchIds.join(', ')}]`);

	// Delete dependent records first (due to FK constraints)
	const deleteShots = prisma.shot.deleteMany({
		where: { matchId: { in: matchIds } }
	});
	const deleteTeamA = prisma.matchTeamA.deleteMany({
		where: { matchId: { in: matchIds } }
	});
	const deleteTeamB = prisma.matchTeamB.deleteMany({
		where: { matchId: { in: matchIds } }
	});

	// Execute deletions in a transaction to keep DB consistent
	const [shotsRes, teamARes, teamBRes] = await prisma.$transaction([
		deleteShots,
		deleteTeamA,
		deleteTeamB
	]);
	console.log(
		`Deleted ${shotsRes.count} shots, ${teamARes.count} team A links, ${teamBRes.count} team B links.`
	);

	// Finally delete the matches
	const deleteMatchesRes = await prisma.match.deleteMany({
		where: { id: { in: matchIds } }
	});
	console.log(`Deleted ${deleteMatchesRes.count} ongoing matches.`);

	console.log('Cleanup complete.');
}

main()
	.catch((e) => {
		console.error('Error deleting ongoing matches:', e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});


