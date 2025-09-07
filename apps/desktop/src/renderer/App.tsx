import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DeckList } from './components/DeckList';
import { CardEditor } from './components/CardEditor';
import { StudyView } from './components/StudyView';
import { Settings } from './components/Settings';

type View = 'decks' | 'editor' | 'study' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('decks');
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);

  useEffect(() => {
    // Set up menu listeners
    if (window.electronAPI) {
      window.electronAPI.onMenuNewCard(() => {
        setCurrentView('editor');
      });

      window.electronAPI.onMenuReview(() => {
        setCurrentView('study');
      });

      window.electronAPI.onMenuSync(() => {
        // TODO: Implement sync functionality
        console.log('Sync requested');
      });

      window.electronAPI.onMenuAbout(() => {
        // TODO: Show about dialog
        console.log('About requested');
      });
    }

    // Cleanup
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('menu-new-card');
        window.electronAPI.removeAllListeners('menu-review');
        window.electronAPI.removeAllListeners('menu-sync');
        window.electronAPI.removeAllListeners('menu-about');
      }
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
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      selectedDeck={selectedDeck}
    >
      {renderCurrentView()}
    </Layout>
  );
}

export default App;