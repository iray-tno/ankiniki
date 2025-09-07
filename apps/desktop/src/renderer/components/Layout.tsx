import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: 'decks' | 'editor' | 'study' | 'settings') => void;
  selectedDeck: string | null;
}

export function Layout({ children, currentView, onViewChange, selectedDeck }: LayoutProps) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">Ankiniki</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-button ${currentView === 'decks' ? 'active' : ''}`}
            onClick={() => onViewChange('decks')}
          >
            📚 Decks
          </button>
          
          <button
            className={`nav-button ${currentView === 'editor' ? 'active' : ''}`}
            onClick={() => onViewChange('editor')}
          >
            ✏️ New Card
          </button>
          
          <button
            className={`nav-button ${currentView === 'study' ? 'active' : ''}`}
            onClick={() => onViewChange('study')}
            disabled={!selectedDeck}
          >
            🎯 Study
          </button>
          
          <button
            className={`nav-button ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => onViewChange('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>
        
        {selectedDeck && (
          <div className="selected-deck">
            <h3>Current Deck</h3>
            <p>{selectedDeck}</p>
          </div>
        )}
      </aside>
      
      <main className="main-content">
        {children}
      </main>
      
      <style jsx>{`
        .app-layout {
          display: flex;
          height: 100vh;
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }
        
        .sidebar {
          width: 250px;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 1rem;
        }
        
        .sidebar-header {
          margin-bottom: 2rem;
        }
        
        .app-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary-color);
        }
        
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        
        .nav-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        
        .nav-button:hover:not(:disabled) {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }
        
        .nav-button.active {
          background-color: var(--primary-color);
          color: white;
        }
        
        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .selected-deck {
          margin-top: auto;
          padding: 1rem;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .selected-deck h3 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }
        
        .selected-deck p {
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .main-content {
          flex: 1;
          overflow: auto;
        }
      `}</style>
    </div>
  );
}