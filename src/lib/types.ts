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
};

export type PlayerWithStats = Player & {
	matchesPlayed: number;
	wins: number;
	losses: number;
	winPercent: number;
	accuracy: number;
	bounceShotsPerGame: number;
	opponentsAccuracyDiff: number;
	recentMatches: RecentMatch[];
};
