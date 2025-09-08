import React, { useState, useEffect } from 'react';

interface DeckListProps {
  onSelectDeck: (deckName: string) => void;
}

interface Deck {
  name: string;
  cardCount: number;
}

export function DeckList({ onSelectDeck }: DeckListProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:3001/api/decks');
      // const data = await response.json();

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockDecks = [
        { name: 'JavaScript Fundamentals', cardCount: 25 },
        { name: 'React Concepts', cardCount: 18 },
        { name: 'Node.js APIs', cardCount: 32 },
        { name: 'TypeScript Types', cardCount: 15 },
      ];

      setDecks(mockDecks);
    } catch (err) {
      setError(
        'Failed to load decks. Make sure Anki is running with AnkiConnect.'
      );
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async () => {
    if (!newDeckName.trim()) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await fetch('http://localhost:3001/api/decks', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: newDeckName }),
      // });

      // Mock creation
      setDecks(prev => [...prev, { name: newDeckName, cardCount: 0 }]);
      setNewDeckName('');
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create deck');
    }
  };

  if (loading) {
    return (
      <div className='deck-list loading'>
        <div className='loading-spinner'>Loading decks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='deck-list error'>
        <div className='error-message'>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadDecks} className='retry-button'>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='deck-list'>
      <header className='deck-list-header'>
        <h1>Your Decks</h1>
        <button
          className='create-deck-button'
          onClick={() => setShowCreateForm(true)}
        >
          + New Deck
        </button>
      </header>

      {showCreateForm && (
        <div className='create-form'>
          <input
            type='text'
            value={newDeckName}
            onChange={e => setNewDeckName(e.target.value)}
            placeholder='Enter deck name...'
            className='deck-name-input'
            autoFocus
          />
          <div className='form-actions'>
            <button onClick={createDeck} className='confirm-button'>
              Create
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewDeckName('');
              }}
              className='cancel-button'
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className='decks-grid'>
        {decks.map(deck => (
          <div
            key={deck.name}
            className='deck-card'
            onClick={() => onSelectDeck(deck.name)}
          >
            <h3 className='deck-name'>{deck.name}</h3>
            <p className='deck-stats'>{deck.cardCount} cards</p>
            <div className='deck-actions'>
              <button className='study-button'>Study</button>
              <button className='edit-button'>Edit</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .deck-list {
          padding: 2rem;
          height: 100%;
          overflow: auto;
        }

        .deck-list.loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          font-size: 1.125rem;
          color: var(--text-secondary);
        }

        .deck-list.error {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-message {
          text-align: center;
          padding: 2rem;
        }

        .error-message h2 {
          color: var(--danger-color);
          margin-bottom: 1rem;
        }

        .error-message p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .retry-button {
          padding: 0.5rem 1rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .deck-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .deck-list-header h1 {
          font-size: 2rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .create-deck-button {
          padding: 0.5rem 1rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-weight: 500;
        }

        .create-deck-button:hover {
          background-color: var(--primary-hover);
        }

        .create-form {
          background-color: var(--bg-secondary);
          padding: 1rem;
          border-radius: var(--radius-lg);
          margin-bottom: 2rem;
        }

        .deck-name-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 1rem;
          margin-bottom: 1rem;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
        }

        .confirm-button {
          padding: 0.5rem 1rem;
          background-color: var(--success-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .cancel-button {
          padding: 0.5rem 1rem;
          background-color: var(--secondary-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .decks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .deck-card {
          background-color: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
        }

        .deck-card:hover {
          border-color: var(--primary-color);
          box-shadow: var(--shadow-md);
        }

        .deck-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .deck-stats {
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .deck-actions {
          display: flex;
          gap: 0.5rem;
        }

        .study-button,
        .edit-button {
          padding: 0.375rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 0.875rem;
        }

        .study-button:hover {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .edit-button:hover {
          background-color: var(--secondary-color);
          color: white;
          border-color: var(--secondary-color);
        }
      `}</style>
    </div>
  );
}
