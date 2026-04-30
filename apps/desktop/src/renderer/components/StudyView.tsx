import React, { useCallback, useEffect, useState } from 'react';

const BACKEND_URL = 'http://localhost:3001';

interface StudyViewProps {
  selectedDeck: string | null;
}

interface StudyCard {
  cardId: number;
  front: string;
  back: string;
  tags: string[];
}

function extractFields(card: {
  fields: Record<string, { value: string; order: number }>;
  tags: string[];
}): { front: string; back: string; tags: string[] } {
  const sorted = Object.entries(card.fields).sort(
    ([, a], [, b]) => a.order - b.order
  );
  return {
    front: sorted[0]?.[1].value ?? '',
    back: sorted[1]?.[1].value ?? '',
    tags: card.tags,
  };
}

export function StudyView({ selectedDeck }: StudyViewProps) {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ studied: 0, correct: 0 });

  const loadDueCards = useCallback(async () => {
    if (!selectedDeck) {
      return;
    }
    setLoading(true);
    setError(null);
    setDone(false);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ studied: 0, correct: 0 });
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/study/due?deck=${encodeURIComponent(selectedDeck)}&limit=20`
      );
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const { data } = await res.json();
      const raw = data.cards as Array<
        { cardId: number } & Parameters<typeof extractFields>[0]
      >;
      setCards(raw.map(c => ({ cardId: c.cardId, ...extractFields(c) })));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load due cards.');
    } finally {
      setLoading(false);
    }
  }, [selectedDeck]);

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  const handleAnswer = async (ease: 1 | 2 | 3 | 4) => {
    const card = cards[currentIndex];
    try {
      await fetch(`${BACKEND_URL}/api/study/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.cardId, ease }),
      });
    } catch {
      // Non-fatal: still advance even if answer submission fails
    }

    setSessionStats(prev => ({
      studied: prev.studied + 1,
      correct: prev.correct + (ease >= 3 ? 1 : 0),
    }));

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setDone(true);
    }
  };

  if (!selectedDeck) {
    return (
      <div className='study-view no-deck'>
        <div className='message'>
          <h2>Select a deck to study</h2>
          <p>Choose a deck from the sidebar to start your study session.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='study-view no-deck'>
        <div className='message'>
          <h2>Loading cards…</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='study-view no-deck'>
        <div className='message'>
          <h2>Error</h2>
          <p>{error}</p>
          <button className='show-answer-button' onClick={loadDueCards}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (done || cards.length === 0) {
    return (
      <div className='study-view no-deck'>
        <div className='message'>
          <h2>{cards.length === 0 ? 'No cards due' : 'Session complete!'}</h2>
          <p>
            {cards.length === 0
              ? 'Great work — nothing due in this deck right now.'
              : `You studied ${sessionStats.studied} card${sessionStats.studied !== 1 ? 's' : ''} — ${sessionStats.correct} correct.`}
          </p>
          <button className='show-answer-button' onClick={loadDueCards}>
            Reload
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className='study-view'>
      <header className='study-header'>
        <div className='study-info'>
          <h1>Studying: {selectedDeck}</h1>
          <div className='progress'>
            Card {currentIndex + 1} of {cards.length}
          </div>
        </div>
        <div className='session-stats'>
          <span>Studied: {sessionStats.studied}</span>
          <span>Correct: {sessionStats.correct}</span>
        </div>
      </header>

      <div className='study-content'>
        <div className='flashcard'>
          <div className='card-front'>
            <div className='card-content'>{currentCard.front}</div>
          </div>

          {showAnswer && (
            <div className='card-back'>
              <div className='card-content'>{currentCard.back}</div>
            </div>
          )}

          {currentCard.tags.length > 0 && (
            <div className='card-tags'>
              {currentCard.tags.map(tag => (
                <span key={tag} className='tag'>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className='study-actions'>
          {!showAnswer ? (
            <button
              className='show-answer-button'
              onClick={() => setShowAnswer(true)}
            >
              Show Answer
            </button>
          ) : (
            <div className='difficulty-buttons'>
              <button
                className='difficulty-button again'
                onClick={() => handleAnswer(1)}
              >
                Again
              </button>
              <button
                className='difficulty-button hard'
                onClick={() => handleAnswer(2)}
              >
                Hard
              </button>
              <button
                className='difficulty-button good'
                onClick={() => handleAnswer(3)}
              >
                Good
              </button>
              <button
                className='difficulty-button easy'
                onClick={() => handleAnswer(4)}
              >
                Easy
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
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
          margin-bottom: 1.5rem;
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
          margin-top: 1rem;
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

        .difficulty-button.again { background-color: var(--danger-color); color: white; }
        .difficulty-button.hard  { background-color: var(--warning-color); color: white; }
        .difficulty-button.good  { background-color: var(--success-color); color: white; }
        .difficulty-button.easy  { background-color: var(--secondary-color); color: white; }

        .difficulty-button:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}
