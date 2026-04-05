import { useState } from 'react';
import Lobby from './components/Lobby';
import RoomLobby from './components/RoomLobby';
import GameView from './components/GameView';
import './App.css';

type GameState = 'lobby' | 'room' | 'playing' | 'gameOver';

function App() {
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');

  const handleGameStart = (code: string, pid: string, _name: string) => {
    setRoomCode(code);
    setPlayerId(pid);
    setGameState('room');
  };

  const handlePlayingStart = () => {
    setGameState('playing');
  };

  const handleLeaveRoom = () => {
    setGameState('lobby');
    setRoomCode('');
    setPlayerId('');
  };

  const handleGameEnd = () => {
    setGameState('gameOver');
  };

  const handlePlayAgain = () => {
    setGameState('lobby');
    setRoomCode('');
    setPlayerId('');
  };

  return (
    <div className="App">
      {gameState === 'lobby' && (
        <Lobby onGameStart={handleGameStart} />
      )}
      {gameState === 'room' && (
        <RoomLobby 
          roomCode={roomCode}
          playerId={playerId}
          onGameStart={handlePlayingStart}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
      {gameState === 'playing' && (
        <GameView 
          roomCode={roomCode}
          playerId={playerId}
          onGameEnd={handleGameEnd}
        />
      )}
      {gameState === 'gameOver' && (
        <div className="game-over-screen">
          <div className="game-over-content">
            <h1>Game Over!</h1>
            <p>Thanks for playing Too Far Game!</p>
            <button onClick={handlePlayAgain}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
