import { useState, useEffect } from 'react';
import { database } from '../firebase.config';
import { ref, onValue } from 'firebase/database';
import { confessions } from '../data';
import { updatePlayerGuess, nextConfession } from '../gameManager';
import type { GameRoom, Player } from '../types';
import './GameView.css';

interface MultiplayerGameViewProps {
  roomCode: string;
  playerId: string;
  onGameEnd: () => void;
}

const GameView: React.FC<MultiplayerGameViewProps> = ({
  roomCode,
  playerId,
  onGameEnd,
}) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  const [showRole, setShowRole] = useState(false);

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val() as GameRoom;
        setRoom(roomData);

        const playerList = Object.values(roomData.players || {});
        setPlayers(playerList);

        const current = roomData.players[playerId];
        if (current) {
          setCurrentPlayer(current);
        }

        // Check if game has ended
        if (roomData.confessionIndex >= confessions.length) {
          onGameEnd();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode, playerId, onGameEnd]);

  const handleGuess = async (guessedPlayerId: string) => {
    if (selectedGuess !== guessedPlayerId) {
      setSelectedGuess(guessedPlayerId);
      try {
        await updatePlayerGuess(roomCode, playerId, guessedPlayerId);
      } catch (err) {
        console.error('Failed to submit guess:', err);
      }
    }
  };



  const handleContinue = async () => {
    try {
      await nextConfession(roomCode);
      setSelectedGuess(null);
      setShowRole(false);
    } catch (err) {
      console.error('Failed to continue:', err);
    }
  };

  if (!room || !currentPlayer) {
    return <div className="loading">Loading game...</div>;
  }

  const confession = confessions[room.confessionIndex] || '';
  const isVotingPhase = room.gameStatus === 'voting';
  const isResultsPhase = room.gameStatus === 'results';

  return (
    <div className="multiplayer-game-view">
      <div className="game-header">
        <h1>Too Far Game - Round {room.confessionIndex + 1}</h1>
        <div className="room-info">Room: {roomCode}</div>
      </div>

      <div className="confession-card">
        <p className="confession-text">{typeof confession === 'string' ? confession : (confession as {text: string}).text}</p>
      </div>

      {isVotingPhase && (
        <>
          <div className="role-section">
            {!showRole && (
              <button 
                className="btn-reveal-role"
                onClick={() => setShowRole(true)}
              >
                Click to See Your Role
              </button>
            )}
            {showRole && (
              <div className={`role-badge ${currentPlayer.role}`}>
                <div className="role-label">Your Role:</div>
                <div className="role-value">
                  {currentPlayer.role === 'truth' ? '✓ TRUTH' : '✗ LIE'}
                </div>
                <div className="role-description">
                  {currentPlayer.role === 'truth' 
                    ? 'Give your honest opinion' 
                    : 'Give the opposite opinion'}
                </div>
              </div>
            )}
          </div>

          {showRole && (
            <div className="next-confession-section">
              <button className="btn-next-confession" onClick={handleContinue}>
                Next Confession
              </button>
            </div>
          )}
        </>
      )}

      {isResultsPhase && !selectedGuess && (
        <div className="guess-section">
          <h3>All votes are in!</h3>
          <p className="guess-prompt">Who do you think is lying?</p>
          
          <div className="players-guess">
            {players.filter(p => p.id !== playerId).map(p => (
              <button
                key={p.id}
                className={`player-guess-btn ${selectedGuess === p.id ? 'selected' : ''}`}
                onClick={() => handleGuess(p.id)}
              >
                <div className="player-avatar-guess">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-name-guess">{p.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedGuess && Object.keys(room.roundGuesses || {}).length < players.length && (
        <div className="waiting-results">
          <h3>You've made your guess!</h3>
          <p>Waiting for {players.length - Object.keys(room.roundGuesses || {}).length} more player(s) to guess...</p>
          <div className="players-guessed">
            {players.map(p => (
              <div key={p.id} className={`player-guess-dot ${room.roundGuesses?.[p.id] ? 'guessed' : ''}`}>
                {room.roundGuesses?.[p.id] ? '✓' : '○'} {p.name}
              </div>
            ))}
          </div>
        </div>
      )}
        <div className="results-section">
          <div className="results-reveal">
            {players.map(p => (
              <div key={p.id} className="result-player">
                <div className="result-header">
                  <span className="player-name-result">
                    {p.name}
                    {p.id === playerId && ' (You)'}
                  </span>
                  <span className={`role-badge-result ${p.role}`}>
                    {p.role === 'truth' ? 'TRUTH' : 'LIE'}
                  </span>
                </div>
                {room.roundGuesses?.[p.id] && (
                  <div className="result-guess">
                    Thinks {players.find(pl => pl.id === room.roundGuesses?.[p.id])?.name} is lying
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="btn-continue" onClick={handleContinue}>
            {room.confessionIndex < confessions.length - 1 ? 'Next Confession' : 'End Game'}
          </button>
        </div>
      )}

      <div className="player-list">
        <h3>Players ({players.length})</h3>
        <div className="players">
          {players.map(p => (
            <div key={p.id} className={`player ${p.id === playerId ? 'current' : ''}`}>
              {p.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameView;