// Game Types and Interfaces

export interface Player {
  id: string;
  name: string;
  role: 'truth' | 'lie' | null;
  vote: 'acceptable' | 'too-far' | null;
  isHost: boolean;
  joinedAt: number;
}

export interface GameRoom {
  id: string;
  hostId: string;
  players: { [playerId: string]: Player };
  confessionIndex: number;
  gameStatus: 'waiting' | 'voting' | 'results' | 'finished';
  roundVotes: { [playerId: string]: 'acceptable' | 'too-far' };
  roundGuesses: { [playerId: string]: string }; // playerId of who they think is lying
  createdAt: number;
  startedAt?: number;
}

export interface GameStats {
  playerEliminatedCount: number;
  playerScores: { [playerId: string]: number };
  roundResults: Array<{
    confession: string;
    liarId: string;
    votes: { [playerId: string]: 'acceptable' | 'too-far' };
    guesses: { [playerId: string]: string };
    correctGuesses: string[];
    playersEliminated: string[];
  }>;
}
