import React, { useEffect, useState } from 'react';

const BACKEND_URL = 'http://localhost:3001';

interface DeckListProps {
  onSelectDeck: (deckName: string) => void;
}

export function DeckList({ onSelectDeck }: DeckListProps) {
  const [decks, setDecks] = useState<string[]>([]);
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
      const res = await fetch(`${BACKEND_URL}/api/decks`);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const { data } = await res.json();
      setDecks(data as string[]);
    } catch (err: any) {
      setError(
        err.message ??
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
      const res = await fetch(`${BACKEND_URL}/api/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeckName.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Server error: ${res.status}`);
      }
      setNewDeckName('');
      setShowCreateForm(false);
      await loadDecks();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create deck');
    }
  };

  const deleteDeck = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete deck "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/decks/${encodeURIComponent(name)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deleteCards: false }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Server error: ${res.status}`);
      }
      await loadDecks();
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete deck');
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
            onKeyDown={e => e.key === 'Enter' && createDeck()}
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

      {decks.length === 0 ? (
        <p className='empty-state'>
          No decks found. Create one above or open Anki to add decks.
        </p>
      ) : (
        <div className='decks-grid'>
          {decks.map(name => (
            <div
              key={name}
              className='deck-card'
              onClick={() => onSelectDeck(name)}
            >
              <h3 className='deck-name'>{name}</h3>
              <div className='deck-actions'>
                <button
                  className='study-button'
                  onClick={e => {
                    e.stopPropagation();
                    onSelectDeck(name);
                  }}
                >
                  Study
                </button>
                <button
                  className='delete-button'
                  onClick={e => deleteDeck(name, e)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
          background-color: var(--bg-primary);
          color: var(--text-primary);
          box-sizing: border-box;
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

        .empty-state {
          color: var(--text-secondary);
          text-align: center;
          padding: 3rem 0;
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
          margin-bottom: 1rem;
        }

        .deck-actions {
          display: flex;
          gap: 0.5rem;
        }

        .study-button,
        .delete-button {
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

        .delete-button:hover {
          background-color: var(--danger-color);
          color: white;
          border-color: var(--danger-color);
        }
      `}</style>
    </div>
  );
}
