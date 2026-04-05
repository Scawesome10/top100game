import { useState, useEffect } from 'react';
import { database } from '../firebase.config';
import { ref, onValue } from 'firebase/database';
import { startGame, deleteRoom } from '../gameManager';
import type { GameRoom } from '../types';
import './RoomLobby.css';

interface RoomLobbyProps {
  roomCode: string;
  playerId: string;
  onGameStart: () => void;
  onLeaveRoom: () => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({
  roomCode,
  playerId,
  onGameStart,
  onLeaveRoom,
}) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val() as GameRoom;
        setRoom(roomData);
        setIsHost(roomData.hostId === playerId);

        // If game has started, call onGameStart
        if (roomData.gameStatus === 'voting') {
          onGameStart();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode, playerId, onGameStart]);

  const handleStartGame = async () => {
    if (!isHost || !room || room.gameStatus !== 'waiting') return;

    const players = room.players || {};
    const playerCount = Object.keys(players).length;
    if (playerCount < 2) {
      setError('Need at least 2 players to start');
      return;
    }

    setIsStarting(true);
    setError('');

    try {
      await startGame(roomCode);
    } catch (err) {
      setError('Failed to start game');
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (isHost && room) {
      // If host leaves, delete the room
      await deleteRoom(roomCode);
    }
    onLeaveRoom();
  };

  if (!room) {
    return (
      <div className="room-lobby">
        <div className="loading">Loading room...</div>
      </div>
    );
  }

  const players = Object.values(room.players || {});

  return (
    <div className="room-lobby">
      <div className="room-container">
        <div className="room-header">
          <h1>Game Room: {roomCode}</h1>
          <button className="btn-close" onClick={handleLeaveRoom}>✕</button>
        </div>

        <div className="room-code-display">
          <p>Share this code with friends:</p>
          <div className="code-box">{roomCode}</div>
          <p className="code-hint">4-character code</p>
        </div>

        <div className="players-section">
          <h2>Players ({players.length})</h2>
          <div className="players-list">
            {players.map((player) => (
              <div key={player.id} className="player-item">
                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <div className="player-name">
                    {player.name}
                    {player.id === playerId && <span className="you-badge">You</span>}
                    {player.isHost && <span className="host-badge">Host</span>}
                  </div>
                  <div className="player-status">Ready</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {isHost ? (
          <div className="host-section">
            <p>You are the host. Start the game when everyone is ready!</p>
            <button
              onClick={handleStartGame}
              disabled={isStarting || players.length < 2}
              className="btn-start"
            >
              {isStarting ? 'Starting...' : 'Start Game'}
            </button>
          </div>
        ) : (
          <div className="waiting-section">
            <p>Waiting for host to start the game...</p>
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;
