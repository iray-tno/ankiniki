import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { DeckList } from './components/DeckList';
import { CardEditor } from './components/CardEditor';
import { StudyView } from './components/StudyView';
import { Settings } from './components/Settings';

const BACKEND_URL = 'http://localhost:3001';

type View = 'decks' | 'editor' | 'study' | 'settings';
type ToastType = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let toastSeq = 0;

function App() {
  const [currentView, setCurrentView] = useState<View>('decks');
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = ++toastSeq;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts(prev => prev.filter(t => t.id !== id)),
      type === 'error' ? 5000 : 3000
    );
  };

  const triggerSync = async () => {
    addToast('info', 'Syncing with AnkiWeb…');
    try {
      const res = await fetch(`${BACKEND_URL}/api/sync`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Server error: ${res.status}`);
      }
      addToast('success', 'Sync complete');
    } catch (err: any) {
      addToast('error', `Sync failed: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!window.electronAPI) {
      return;
    }

    window.electronAPI.onMenuNewCard(() => setCurrentView('editor'));
    window.electronAPI.onMenuReview(() => setCurrentView('study'));
    window.electronAPI.onMenuSync(() => triggerSync());
    window.electronAPI.onMenuAbout(() =>
      addToast('info', 'Ankiniki v0.1.0 — Anki companion tool for engineers')
    );

    return () => {
      window.electronAPI?.removeAllListeners('menu-new-card');
      window.electronAPI?.removeAllListeners('menu-review');
      window.electronAPI?.removeAllListeners('menu-sync');
      window.electronAPI?.removeAllListeners('menu-about');
    };
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'decks':
        return <DeckList onSelectDeck={setSelectedDeck} />;
      case 'editor':
        return <CardEditor selectedDeck={selectedDeck} />;
      case 'study':
        return <StudyView selectedDeck={selectedDeck} />;
      case 'settings':
        return <Settings />;
      default:
        return <DeckList onSelectDeck={setSelectedDeck} />;
    }
  };

  return (
    <>
      <Layout
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedDeck={selectedDeck}
      >
        {renderCurrentView()}
      </Layout>

      {toasts.length > 0 && (
        <div className='toast-container'>
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.message}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 9999;
        }

        .toast {
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slide-in 0.2s ease;
          max-width: 320px;
        }

        .toast-info    { background: #3b82f6; color: white; }
        .toast-success { background: #22c55e; color: white; }
        .toast-error   { background: #ef4444; color: white; }

        @keyframes slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default App;
