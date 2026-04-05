import { useState } from 'react';
import { createGameRoom, joinGameRoom, generatePlayerId } from '../gameManager';
import './Lobby.css';

interface LobbyProps {
  onGameStart: (roomCode: string, playerId: string, playerName: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onGameStart }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const newRoomCode = await createGameRoom();
      const playerId = generatePlayerId();
      await joinGameRoom(newRoomCode, playerName, playerId, true);
      onGameStart(newRoomCode, playerId, playerName);
    } catch (err) {
      console.error('Create room failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to create room. Please try again.';
      setError(`Failed to create room: ${message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim() || roomCode.length !== 4) {
      setError('Please enter a valid 4-character room code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const playerId = generatePlayerId();
      const joined = await joinGameRoom(roomCode.toUpperCase(), playerName, playerId, false);
      
      if (!joined) {
        setError('Room not found. Please check the code and try again.');
      } else {
        onGameStart(roomCode.toUpperCase(), playerId, playerName);
      }
    } catch (err) {
      console.error('Join room failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to join room. Please try again.';
      setError(`Failed to join room: ${message}`);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-container">
        <h1>Too Far Game</h1>
        <p className="subtitle">A Multiplayer Party Game</p>

        <div className="lobby-content">
          <div className="input-section">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (isJoining) handleJoinRoom();
                  else handleCreateRoom();
                }
              }}
              maxLength={20}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-section">
            <button
              onClick={handleCreateRoom}
              disabled={isCreating || isJoining}
              className="btn-primary"
            >
              {isCreating ? 'Creating...' : 'Create New Game'}
            </button>
          </div>

          <div className="divider">OR</div>

          <div className="join-section">
            <input
              type="text"
              placeholder="Room Code (e.g., ABC1)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleJoinRoom();
              }}
            />
            <button
              onClick={handleJoinRoom}
              disabled={isCreating || isJoining}
              className="btn-secondary"
            >
              {isJoining ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </div>

        <div className="how-to-play">
          <h3>How to Play:</h3>
          <ul>
            <li>One player creates a game and shares the room code</li>
            <li>Others join using the code</li>
            <li>Once everyone joins, the host starts the game</li>
            <li>Players are randomly assigned Truth or Lie roles</li>
            <li>Truth players give their honest opinion, Lie players do the opposite</li>
            <li>Guess who the liar is and earn points!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
