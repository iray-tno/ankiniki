import React, { useEffect, useState } from 'react';

const BACKEND_URL = 'http://localhost:3001';

interface CardEditorProps {
  selectedDeck: string | null;
}

export function CardEditor({ selectedDeck }: CardEditorProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState('');
  const [deckName, setDeckName] = useState(selectedDeck ?? '');
  const [decks, setDecks] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/decks`)
      .then(r => r.json())
      .then(({ data }) => setDecks(data as string[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedDeck) {
      setDeckName(selectedDeck);
    }
  }, [selectedDeck]);

  const handleSave = async () => {
    if (!front.trim() || !back.trim() || !deckName.trim()) {
      setStatus({
        type: 'error',
        message: 'Deck, Front and Back are required.',
      });
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckName,
          modelName: 'Basic',
          fields: { Front: front.trim(), Back: back.trim() },
          tags: tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message ?? `Server error: ${res.status}`);
      }
      setStatus({
        type: 'success',
        message: `Card saved (note ID ${body.data.noteId})`,
      });
      setFront('');
      setBack('');
      setTags('');
      setPreview(false);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to create card',
      });
    } finally {
      setSaving(false);
    }
  };

  const insertCodeBlock = (field: 'front' | 'back') => {
    const template = '```javascript\n// Your code here\n```';
    if (field === 'front') {
      setFront(prev => prev + template);
    } else {
      setBack(prev => prev + template);
    }
  };

  return (
    <div className='card-editor'>
      <header className='editor-header'>
        <h1>Create New Card</h1>
        <div className='editor-actions'>
          <button
            className={`preview-button ${preview ? 'active' : ''}`}
            onClick={() => setPreview(!preview)}
          >
            👁️ Preview
          </button>
          <button
            className='save-button'
            onClick={handleSave}
            disabled={saving}
          >
            💾 {saving ? 'Saving…' : 'Save Card'}
          </button>
        </div>
      </header>

      {status && (
        <div className={`status-banner status-${status.type}`}>
          {status.message}
        </div>
      )}

      <div className='editor-content'>
        <div className='form-section'>
          <label htmlFor='deck-select'>Deck</label>
          <select
            id='deck-select'
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            className='deck-select'
          >
            <option value=''>Select a deck...</option>
            {decks.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {!preview ? (
          <div className='editor-fields'>
            <div className='field-section'>
              <div className='field-header'>
                <label htmlFor='front-field'>Front (Question)</label>
                <button
                  className='code-button'
                  onClick={() => insertCodeBlock('front')}
                >
                  {'</>'}
                </button>
              </div>
              <textarea
                id='front-field'
                value={front}
                onChange={e => setFront(e.target.value)}
                placeholder='Enter the question or prompt...'
                className='field-textarea'
                rows={6}
              />
            </div>

            <div className='field-section'>
              <div className='field-header'>
                <label htmlFor='back-field'>Back (Answer)</label>
                <button
                  className='code-button'
                  onClick={() => insertCodeBlock('back')}
                >
                  {'</>'}
                </button>
              </div>
              <textarea
                id='back-field'
                value={back}
                onChange={e => setBack(e.target.value)}
                placeholder='Enter the answer or explanation...'
                className='field-textarea'
                rows={6}
              />
            </div>

            <div className='field-section'>
              <label htmlFor='tags-field'>Tags (comma-separated)</label>
              <input
                type='text'
                id='tags-field'
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder='javascript, function, basics'
                className='tags-input'
              />
            </div>
          </div>
        ) : (
          <div className='preview-mode'>
            <div className='card-preview'>
              <div className='preview-front'>
                <h3>Front</h3>
                <div className='preview-content'>
                  {front || <span className='placeholder'>No content</span>}
                </div>
              </div>
              <div className='preview-back'>
                <h3>Back</h3>
                <div className='preview-content'>
                  {back || <span className='placeholder'>No content</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .card-editor {
          padding: 2rem;
          height: 100%;
          overflow: auto;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .editor-header h1 {
          font-size: 2rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .editor-actions {
          display: flex;
          gap: 1rem;
        }

        .preview-button {
          padding: 0.5rem 1rem;
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .preview-button.active {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .save-button {
          padding: 0.5rem 1rem;
          background-color: var(--success-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .save-button:not(:disabled):hover {
          opacity: 0.9;
        }

        .status-banner {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }

        .status-success {
          background-color: color-mix(in srgb, var(--success-color) 15%, transparent);
          color: var(--success-color);
          border: 1px solid color-mix(in srgb, var(--success-color) 40%, transparent);
        }

        .status-error {
          background-color: color-mix(in srgb, var(--danger-color) 15%, transparent);
          color: var(--danger-color);
          border: 1px solid color-mix(in srgb, var(--danger-color) 40%, transparent);
        }

        .editor-content {
          max-width: 800px;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section label {
          display: block;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .deck-select {
          width: 100%;
          max-width: 300px;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .editor-fields {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .field-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .code-button {
          padding: 0.25rem 0.5rem;
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .code-button:hover {
          background-color: var(--border-color);
        }

        .field-textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 1rem;
          resize: vertical;
          min-height: 120px;
          box-sizing: border-box;
        }

        .field-textarea:focus {
          border-color: var(--primary-color);
          outline: none;
        }

        .tags-input {
          width: 100%;
          max-width: 400px;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .preview-mode {
          margin-top: 1rem;
        }

        .card-preview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .preview-front,
        .preview-back {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          background-color: var(--bg-secondary);
        }

        .preview-front h3,
        .preview-back h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .preview-content {
          white-space: pre-wrap;
          color: var(--text-primary);
          line-height: 1.6;
        }

        .placeholder {
          color: var(--text-tertiary);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
