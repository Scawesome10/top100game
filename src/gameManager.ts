import { database } from './firebase.config';
import { ref, set, get, remove, onValue } from 'firebase/database';
import type { Player, GameRoom } from './types';

// Listeners map for managing Firebase subscriptions
const listeners: { [roomCode: string]: { callback: () => void; unsubscribe: () => void }[] } = {};

export const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

export const generatePlayerId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

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

  try {
    await set(roomRef, newRoom);
  } catch (err) {
    console.error('Firebase create room error:', err);
    throw err;
  }

  return roomCode;
};

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
  const players = room.players || {};

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    role: null,
    vote: null,
    isHost: isHost || Object.keys(players).length === 0,
    joinedAt: Date.now(),
  };

  const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
  await set(playerRef, newPlayer);

  // Update host if this is the first player
  if (Object.keys(players).length === 0) {
    const hostRef = ref(database, `rooms/${roomCode}/hostId`);
    await set(hostRef, playerId);
  }

  return true;
};

export const getGameRoom = async (roomCode: string): Promise<GameRoom | null> => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as GameRoom;
};

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

export const updatePlayerGuess = async (
  roomCode: string,
  playerId: string,
  guessedPlayerId: string
): Promise<void> => {
  const guessRef = ref(database, `rooms/${roomCode}/roundGuesses/${playerId}`);
  await set(guessRef, guessedPlayerId);
};

export const assignRoles = async (roomCode: string): Promise<void> => {
  const room = await getGameRoom(roomCode);
  if (!room) return;

  const players = room.players || {};
  const playerIds = Object.keys(players);
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
    const players = room.players || {};
    for (const playerId of Object.keys(players)) {
      const playerVoteRef = ref(database, `rooms/${roomCode}/players/${playerId}/vote`);
      await set(playerVoteRef, null);
    }
  }
};

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
    const players = room2.players || {};
    for (const playerId of Object.keys(players)) {
      const playerVoteRef = ref(database, `rooms/${roomCode}/players/${playerId}/vote`);
      await set(playerVoteRef, null);
      const playerRoleRef = ref(database, `rooms/${roomCode}/players/${playerId}/role`);
      await set(playerRoleRef, null);
    }
  }

  // Re-assign roles
  await assignRoles(roomCode);
};

export const revealResults = async (roomCode: string): Promise<void> => {
  const statusRef = ref(database, `rooms/${roomCode}/gameStatus`);
  await set(statusRef, 'results');
};

export const deleteRoom = async (roomCode: string): Promise<void> => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await remove(roomRef);
};

export const subscribeToRoom = (
  roomCode: string,
  callback: () => void
): (() => void) => {
  const roomRef = ref(database, `rooms/${roomCode}`);

  const unsubscribe = onValue(roomRef, () => {
    callback();
  });

  if (!listeners[roomCode]) {
    listeners[roomCode] = [];
  }

  listeners[roomCode].push({ callback, unsubscribe });

  // Return unsubscribe function
  return () => {
    const index = listeners[roomCode].findIndex(l => l.callback === callback);
    if (index > -1) {
      listeners[roomCode][index].unsubscribe();
      listeners[roomCode].splice(index, 1);
    }
  };
};
