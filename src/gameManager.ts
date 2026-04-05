import { database } from './firebase.config';
import { ref, set, get, remove } from 'firebase/database';
import type { Player, GameRoom } from './types';

// Generate a room code (4 characters)
export const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

// Generate a player ID
export const generatePlayerId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Create a new game room
export const createGameRoom = async (): Promise<string> => {
  const roomCode = generateRoomCode();
  const roomRef = ref(database, `rooms/${roomCode}`);

  const newRoom: GameRoom = {
    id: roomCode,
    hostId: '',
    players: {},
    confessionIndex: 0,
    gameStatus: 'waiting',
    roundVotes: {},
    roundGuesses: {},
    createdAt: Date.now(),
  };

  await set(roomRef, newRoom);
  return roomCode;
};

// Join a game room
export const joinGameRoom = async (
  roomCode: string,
  playerName: string,
  playerId: string,
  isHost: boolean = false
): Promise<boolean> => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return false;
  }

  const room = snapshot.val() as GameRoom;

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    role: null,
    vote: null,
    isHost: isHost || Object.keys(room.players).length === 0,
    joinedAt: Date.now(),
  };

  const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
  await set(playerRef, newPlayer);

  // Update host if this is the first player
  if (Object.keys(room.players).length === 0) {
    const hostRef = ref(database, `rooms/${roomCode}/hostId`);
    await set(hostRef, playerId);
  }

  return true;
};

// Get game room
export const getGameRoom = async (roomCode: string): Promise<GameRoom | null> => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as GameRoom;
};

// Update player vote
export const updatePlayerVote = async (
  roomCode: string,
  playerId: string,
  vote: 'acceptable' | 'too-far'
): Promise<void> => {
  const voteRef = ref(database, `rooms/${roomCode}/roundVotes/${playerId}`);
  await set(voteRef, vote);

  const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}/vote`);
  await set(playerRef, vote);
};

// Update player guess (who they think is the liar)
export const updatePlayerGuess = async (
  roomCode: string,
  playerId: string,
  guessedPlayerId: string
): Promise<void> => {
  const guessRef = ref(database, `rooms/${roomCode}/roundGuesses/${playerId}`);
  await set(guessRef, guessedPlayerId);
};

// Assign roles (majority truth, minority lie)
export const assignRoles = async (roomCode: string): Promise<void> => {
  const room = await getGameRoom(roomCode);
  if (!room) return;

  const playerIds = Object.keys(room.players);
  const numPlayers = playerIds.length;

  // Calculate how many liars (1/3 of players, minimum 1, maximum 25%)
  const numLiars = Math.max(1, Math.ceil(numPlayers / 3));

  // Shuffle and assign
  const shuffled = playerIds.sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    const role = i < numLiars ? 'lie' : 'truth';
    const roleRef = ref(database, `rooms/${roomCode}/players/${shuffled[i]}/role`);
    await set(roleRef, role);
  }
};

// Start the game
export const startGame = async (roomCode: string): Promise<void> => {
  await assignRoles(roomCode);

  const statusRef = ref(database, `rooms/${roomCode}/gameStatus`);
  await set(statusRef, 'voting');

  const startTimeRef = ref(database, `rooms/${roomCode}/startedAt`);
  await set(startTimeRef, Date.now());

  // Reset votes for new round
  const votesRef = ref(database, `rooms/${roomCode}/roundVotes`);
  await set(votesRef, {});

  const guessesRef = ref(database, `rooms/${roomCode}/roundGuesses`);
  await set(guessesRef, {});

  // Reset player votes
  const room = await getGameRoom(roomCode);
  if (room) {
    for (const playerId of Object.keys(room.players)) {
      const playerVoteRef = ref(database, `rooms/${roomCode}/players/${playerId}/vote`);
      await set(playerVoteRef, null);
    }
  }
};

// Move to next confession
export const nextConfession = async (roomCode: string): Promise<void> => {
  const confessionRef = ref(database, `rooms/${roomCode}/confessionIndex`);
  const room = await getGameRoom(roomCode);
  if (room) {
    await set(confessionRef, room.confessionIndex + 1);
  }

  // Reset votes for new round
  const votesRef = ref(database, `rooms/${roomCode}/roundVotes`);
  await set(votesRef, {});

  const guessesRef = ref(database, `rooms/${roomCode}/roundGuesses`);
  await set(guessesRef, {});

  // Reset player votes and reset role assignment
  const room2 = await getGameRoom(roomCode);
  if (room2) {
    for (const playerId of Object.keys(room2.players)) {
      const playerVoteRef = ref(database, `rooms/${roomCode}/players/${playerId}/vote`);
      await set(playerVoteRef, null);
      const playerRoleRef = ref(database, `rooms/${roomCode}/players/${playerId}/role`);
      await set(playerRoleRef, null);
    }
  }

  // Re-assign roles
  await assignRoles(roomCode);
};

// Reveal results and move to guessing phase
export const revealResults = async (roomCode: string): Promise<void> => {
  const statusRef = ref(database, `rooms/${roomCode}/gameStatus`);
  await set(statusRef, 'results');
};

// Delete room
export const deleteRoom = async (roomCode: string): Promise<void> => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await remove(roomRef);
};
