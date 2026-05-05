export type Player = {
	id: number;
	name: string;
	elo: number;
};

export type MatchupRow = {
	name: string;
	games: number;
	wins: number;
	losses: number;
	shotsHit: number;
	shotsTotal: number;
	theirShotsHit: number;
	theirShotsTotal: number;
	theirGlobalAccuracyPct: number;
	theirWinPercentVsUs: number;
	theirGlobalWinPercent: number;
};

export type MatchupApiRow = MatchupRow & { id: number };

export type MatchupResponse = {
	byOpponents: MatchupApiRow[];
	byPartners: MatchupApiRow[];
};

export type EloMatchPoint = {
	createdAt: string;
	eloVariation: number | null;
};

export type SeriesPoint = { date: Date; elo: number };

export type PlayerLite = { name: string; elo: number };

export type TeamEntry = { player: PlayerLite };

export type MatchLite = {
	id: number;
	createdAt: string;
	teamAmineSide: TeamEntry[];
	teamRobinSide: TeamEntry[];
	winnerA: boolean;
	winnerB: boolean;
};

export type MatchTeamEntry = {
	matchId: number;
	playerId: number;
	player: Player;
};

export type MatchFull = {
	id: number;
	createdAt: string;
	winnerA: boolean;
	winnerB: boolean;
	status: string;
	eloVariationTeamA: number | null;
	eloVariationTeamB: number | null;
	numberOfShotByMatch: number;
	teamAmineSide: MatchTeamEntry[];
	teamRobinSide: MatchTeamEntry[];
};

export type Shot = {
	player: string;
	hit: boolean;
	cup: number | null;
	bounceCup?: number | null;
	sequence: number;
	round: number;
	team?: string;
	isCounter: boolean;
};

export type ShotRecap = {
	playerId: number;
	player: string | null;
	cup: number | null;
	bounceCup: number | null;
	hit: boolean;
	team: string;
	round: number;
	sequence: number;
	isCounter: boolean;
};

export type ShotPost = {
	matchId: number; playerId: number; hit: boolean; cup: number | null; team: string; sequence: number; round: number; isCounter: boolean;
}

export type RecentMatch = {
	id: number;
	createdAt: string;
	opponents: Player[];
	won: boolean;
	eloVariation: number | null;
};

export type PlayerDetail = Player & {
	matchesPlayed: number;
	wins: number;
	losses: number;
	winPercent: number;
	accuracy: number;
	recentMatches: RecentMatch[];
};

export type PlayerStats = {
	matchesPlayed: number;
	wins: number;
	losses: number;
	winPercent: number;
	accuracy: number;
	bounceShots: number;
	opponentsAccuracyDiff: number;
	counterAccuracy: number;
};

export type PlayerWithStats = Player & {
	matchesPlayed: number;
	wins: number;
	losses: number;
	winPercent: number;
	accuracy: number;
	bounceShotsPerGame: number;
	opponentsAccuracyDiff: number;
	counterAccuracy: number;
	recentMatches: RecentMatch[];
};

export type PlayerLeaderboard = Player & {
	matchesPlayed: number;
	winPercent: number;
	accuracy: number;
};

export type CupAccuracyPoint = {
	cupsRemaining: number;
	hits: number;
	total: number;
	accuracy: number;
};

export type HallOfFameCardEntry = {
	rank: number;
	label: string;
	subLabel?: string;
	value: string;
	onClick?: () => void;
};

export type HallOfFameMatchEntry = {
	rank: number;
	matchId: number;
	value: number;
	createdAt: string;
	teamA: string[];
	teamB: string[];
	winnerA: boolean;
};

export type HallOfFamePlayerEntry = {
	rank: number;
	playerId: number;
	playerName: string;
	value: number;
};

export type HallOfFamePlayerMatchEntry = {
	rank: number;
	playerId: number;
	playerName: string;
	matchId: number;
	createdAt: string;
	value: number;
};

export type HallOfFameDuoEntry = {
	rank: number;
	player1Id: number;
	player1Name: string;
	player2Id: number;
	player2Name: string;
	games: number;
	valuePct: number; // delta in percentage points (already * 100)
};

export type HallOfFameOpponentEntry = {
	rank: number;
	playerId: number;
	playerName: string;
	opponentId: number;
	opponentName: string;
	games: number;
	valuePct: number;
};

export type HallOfFameData = {
	longestGames: HallOfFameMatchEntry[];
	shortestGames: HallOfFameMatchEntry[];
	mostBouncesPerGame: HallOfFamePlayerEntry[];
	mostCountersInGame: HallOfFameMatchEntry[];
	mostCountersScoredInGame: HallOfFamePlayerMatchEntry[];
	biggestEloSwings: HallOfFameMatchEntry[];
	bestCounterAccuracy: HallOfFamePlayerEntry[];
	bestSingleGameAccuracy: HallOfFamePlayerMatchEntry[];
	bestDuoWinRate: HallOfFameDuoEntry[];
	worstDuoWinRate: HallOfFameDuoEntry[];
	bestDuoAccuracy: HallOfFameDuoEntry[];
	worstDuoAccuracy: HallOfFameDuoEntry[];
	bestOpponentWinRate: HallOfFameOpponentEntry[];
	worstOpponentWinRate: HallOfFameOpponentEntry[];
	bestOpponentAccuracy: HallOfFameOpponentEntry[];
	worstOpponentAccuracy: HallOfFameOpponentEntry[];
};
