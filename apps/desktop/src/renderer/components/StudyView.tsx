import React, { useState } from 'react';

interface StudyViewProps {
  selectedDeck: string | null;
}

interface Card {
  id: string;
  front: string;
  back: string;
  tags: string[];
}

export function StudyView({ selectedDeck }: StudyViewProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    studied: 0,
    correct: 0,
  });

  // Mock cards for demo
  const mockCards: Card[] = [
    {
      id: '1',
      front: 'What is the difference between `let` and `var` in JavaScript?',
      back: '`let` has block scope and cannot be redeclared in the same scope, while `var` has function scope and can be redeclared. `let` also has temporal dead zone.',
      tags: ['javascript', 'variables'],
    },
    {
      id: '2',
      front: 'How do you create a functional component in React?',
      back: '```jsx\nfunction MyComponent(props) {\n  return <div>Hello {props.name}</div>;\n}\n```',
      tags: ['react', 'components'],
    },
  ];

  const currentCard = mockCards[currentCardIndex];

  if (!selectedDeck) {
    return (
      <div className="study-view no-deck">
        <div className="message">
          <h2>Select a deck to study</h2>
          <p>Choose a deck from the sidebar to start your study session.</p>
        </div>
      </div>
    );
  }

  const handleAnswer = (difficulty: 'again' | 'hard' | 'good' | 'easy') => {
    // Update session stats
    setSessionStats(prev => ({
      studied: prev.studied + 1,
      correct: prev.correct + (difficulty === 'good' || difficulty === 'easy' ? 1 : 0),
    }));

    // Move to next card
    if (currentCardIndex < mockCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Session complete
      alert(`Session complete! You studied ${sessionStats.studied + 1} cards.`);
    }
  };

  return (
    <div className="study-view">
      <header className="study-header">
        <div className="study-info">
          <h1>Studying: {selectedDeck}</h1>
          <div className="progress">
            Card {currentCardIndex + 1} of {mockCards.length}
          </div>
        </div>
        <div className="session-stats">
          <span>Studied: {sessionStats.studied}</span>
          <span>Correct: {sessionStats.correct}</span>
        </div>
      </header>

      <div className="study-content">
        <div className="flashcard">
          <div className="card-front">
            <div className="card-content">
              {currentCard.front}
            </div>
          </div>

          {showAnswer && (
            <div className="card-back">
              <div className="card-content">
                {currentCard.back}
              </div>
            </div>
          )}

          <div className="card-tags">
            {currentCard.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="study-actions">
          {!showAnswer ? (
            <button
              className="show-answer-button"
              onClick={() => setShowAnswer(true)}
            >
              Show Answer
            </button>
          ) : (
            <div className="difficulty-buttons">
              <button
                className="difficulty-button again"
                onClick={() => handleAnswer('again')}
              >
                Again
              </button>
              <button
                className="difficulty-button hard"
                onClick={() => handleAnswer('hard')}
              >
                Hard
              </button>
              <button
                className="difficulty-button good"
                onClick={() => handleAnswer('good')}
              >
                Good
              </button>
              <button
                className="difficulty-button easy"
                onClick={() => handleAnswer('easy')}
              >
                Easy
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .study-view {
          padding: 2rem;
          height: 100%;
          overflow: auto;
        }
        
        .study-view.no-deck {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .message {
          text-align: center;
        }
        
        .message h2 {
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        
        .message p {
          color: var(--text-tertiary);
        }
        
        .study-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }
        
        .study-info h1 {
          font-size: 2rem;
          font-weight: bold;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        
        .progress {
          color: var(--text-secondary);
          font-size: 1rem;
        }
        
        .session-stats {
          display: flex;
          gap: 2rem;
          color: var(--text-secondary);
        }
        
        .study-content {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .flashcard {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-lg);
        }
        
        .card-front,
        .card-back {
          margin-bottom: 1.5rem;
        }
        
        .card-content {
          font-size: 1.125rem;
          line-height: 1.7;
          color: var(--text-primary);
          white-space: pre-wrap;
        }
        
        .card-back {
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
        }
        
        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .tag {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background-color: var(--primary-color);
          color: white;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
        }
        
        .study-actions {
          display: flex;
          justify-content: center;
        }
        
        .show-answer-button {
          padding: 1rem 2rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 1.125rem;
          font-weight: 500;
        }
        
        .show-answer-button:hover {
          background-color: var(--primary-hover);
        }
        
        .difficulty-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .difficulty-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-weight: 500;
          min-width: 80px;
        }
        
        .difficulty-button.again {
          background-color: var(--danger-color);
          color: white;
        }
        
        .difficulty-button.hard {
          background-color: var(--warning-color);
          color: white;
        }
        
        .difficulty-button.good {
          background-color: var(--success-color);
          color: white;
        }
        
        .difficulty-button.easy {
          background-color: var(--secondary-color);
          color: white;
        }
        
        .difficulty-button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}