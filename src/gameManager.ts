// Local game state manager using localStorage
// This is a simplified version that works immediately without external backends

import type { Player, GameRoom } from './types';

const STORAGE_KEY = 'too_far_game_rooms';

// In-memory listeners for real-time updates
const listeners: { [roomCode: string]: Set<() => void> } = {};

export const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

export const generatePlayerId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

const getAllRooms = (): { [key: string]: GameRoom } => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveRooms = (rooms: { [key: string]: GameRoom }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    // Notify all listeners
    Object.keys(listeners).forEach(roomCode => {
      listeners[roomCode].forEach(listener => listener());
    });
  } catch (e) {
    console.error('Failed to save rooms:', e);
  }
};

export const createGameRoom = async (): Promise<string> => {
  const roomCode = generateRoomCode();
  const rooms = getAllRooms();

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

  rooms[roomCode] = newRoom;
  saveRooms(rooms);
  return roomCode;
};

export const joinGameRoom = async (
  roomCode: string,
  playerName: string,
  playerId: string,
  isHost: boolean = false
): Promise<boolean> => {
  const rooms = getAllRooms();
  
  if (!rooms[roomCode]) {
    return false;
  }

  const room = rooms[roomCode];

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    role: null,
    vote: null,
    isHost: isHost || Object.keys(room.players).length === 0,
    joinedAt: Date.now(),
  };

  room.players[playerId] = newPlayer;

  // Set host if this is the first player
  if (Object.keys(room.players).length === 1) {
    room.hostId = playerId;
  }

  saveRooms(rooms);
  return true;
};

export const getGameRoom = async (roomCode: string): Promise<GameRoom | null> => {
  const rooms = getAllRooms();
  return rooms[roomCode] || null;
};

export const updatePlayerVote = async (
  roomCode: string,
  playerId: string,
  vote: 'acceptable' | 'too-far'
): Promise<void> => {
  const rooms = getAllRooms();
  const room = rooms[roomCode];

  if (!room) return;

  room.roundVotes[playerId] = vote;
  room.players[playerId].vote = vote;

  saveRooms(rooms);
};

export const updatePlayerGuess = async (
  roomCode: string,
  playerId: string,
  guessedPlayerId: string
): Promise<void> => {
  const rooms = getAllRooms();
  const room = rooms[roomCode];

  if (!room) return;

  room.roundGuesses[playerId] = guessedPlayerId;

  saveRooms(rooms);
};

export const assignRoles = async (roomCode: string): Promise<void> => {
  const rooms = getAllRooms();
  const room = rooms[roomCode];

  if (!room) return;

  const playerIds = Object.keys(room.players);
  const numPlayers = playerIds.length;

  // Calculate how many liars (1/3 of players, minimum 1, maximum 25%)
  const numLiars = Math.max(1, Math.ceil(numPlayers / 3));

  // Shuffle and assign
  const shuffled = playerIds.sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    const role = i < numLiars ? 'lie' : 'truth';
    room.players[shuffled[i]].role = role;
  }

  saveRooms(rooms);
};

export const startGame = async (roomCode: string): Promise<void> => {
  const rooms = getAllRooms();
  const room = rooms[roomCode];

  if (!room) return;

  await assignRoles(roomCode);

  room.gameStatus = 'voting';
  room.startedAt = Date.now();
  room.roundVotes = {};
  room.roundGuesses = {};

  // Reset player votes
  for (const playerId of Object.keys(room.players)) {
    room.players[playerId].vote = null;
  }

  saveRooms(rooms);
};

export const nextConfession = async (roomCode: string): Promise<void> => {
  const rooms = getAllRooms();
  const room = rooms[roomCode];

  if (!room) return;

  room.confessionIndex += 1;
  room.roundVotes = {};
  room.roundGuesses = {};

  // Reset player votes and roles
  for (const playerId of Object.keys(room.players)) {
    room.players[playerId].vote = null;
    room.players[playerId].role = null;
  }

  // Re-assign roles
  await assignRoles(roomCode);

  saveRooms(rooms);
};

export const revealResults = async (roomCode: string): Promise<void> => {
  const rooms = getAllRooms();
  const room = rooms[roomCode];

  if (!room) return;

  room.gameStatus = 'results';
  saveRooms(rooms);
};

export const deleteRoom = async (roomCode: string): Promise<void> => {
  const rooms = getAllRooms();
  delete rooms[roomCode];
  saveRooms(rooms);
};

// Subscribe to room changes
export const subscribeToRoom = (
  roomCode: string,
  callback: () => void
): (() => void) => {
  if (!listeners[roomCode]) {
    listeners[roomCode] = new Set();
  }

  listeners[roomCode].add(callback);

  // Return unsubscribe function
  return () => {
    listeners[roomCode].delete(callback);
  };
};
