import React, { useState } from 'react';
import { confessions } from '../data';
import './GameView.css';

const GameView: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [responses, setResponses] = useState<boolean[]>([]);

  const handleChoice = (isTooFar: boolean) => {
    const newResponses = [...responses, isTooFar];
    setResponses(newResponses);

    if (isTooFar) {
      setScore(score + 1);
    }

    if (currentIndex < confessions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setGameOver(true);
    }
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setGameOver(false);
    setResponses([]);
  };

  if (gameOver) {
    const extremityLevel = score / confessions.length;
    let message = '';
    if (extremityLevel < 0.3) {
      message = 'You have a strong moral compass! Most things are acceptable to you.';
    } else if (extremityLevel < 0.7) {
      message = 'You have a balanced view. Some things are too far, others are not.';
    } else {
      message = 'You think most things are too far! You have high standards.';
    }

    return (
      <div className="game-over">
        <h2>Game Over!</h2>
        <p>You marked {score} out of {confessions.length} confessions as "Too Far".</p>
        <p>{message}</p>
        <button onClick={resetGame}>Play Again</button>
      </div>
    );
  }

  return (
    <div className="game-view">
      <h1>Too Far Game</h1>
      <div className="confession-card">
        <p className="confession-text">{confessions[currentIndex].text}</p>
      </div>
      <div className="buttons">
        <button className="acceptable" onClick={() => handleChoice(false)}>Acceptable</button>
        <button className="too-far" onClick={() => handleChoice(true)}>Too Far</button>
      </div>
      <div className="progress">
        Confession {currentIndex + 1} of {confessions.length}
      </div>
      <div className="score">
        Too Far Score: {score}
      </div>
    </div>
  );
};

export default GameView;