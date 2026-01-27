export type WhitelistState = {
	players: string[];
};

const defaultWhitelist: string[] = [
	'Robin',
	'Amine',
	'Lucas',
	'Sandro',
	'Richard',
	'Ken',
	'MJ',
];

let state: WhitelistState = {
	players: [...defaultWhitelist]
};

export function getWhitelistedPlayers(): string[] {
	return state.players;
}

export function setWhitelistedPlayers(nextPlayers: string[]): void {
	state = { players: [...nextPlayers] };
}


