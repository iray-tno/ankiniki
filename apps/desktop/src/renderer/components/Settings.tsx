import React, { useState } from 'react';

export function Settings() {
  const [settings, setSettings] = useState({
    ankiConnectUrl: 'http://localhost:8765',
    theme: 'system',
    autoSync: true,
    newCardsPerDay: 20,
    reviewCardsPerDay: 200,
  });

  const handleSave = () => {
    // TODO: Implement settings save
    console.log('Saving settings:', settings);
    alert('Settings saved!');
  };

  const testConnection = async () => {
    try {
      // TODO: Implement actual connection test
      // const response = await fetch(`${settings.ankiConnectUrl}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action: 'version', version: 6 }),
      // });
      
      // Mock successful connection
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('✅ Connection successful!');
    } catch (error) {
      alert('❌ Connection failed. Make sure Anki is running with AnkiConnect addon.');
    }
  };

  return (
    <div className="settings">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        <div className="settings-section">
          <h2>AnkiConnect Configuration</h2>
          <div className="setting-item">
            <label htmlFor="anki-url">AnkiConnect URL</label>
            <div className="url-input-group">
              <input
                type="text"
                id="anki-url"
                value={settings.ankiConnectUrl}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, ankiConnectUrl: e.target.value }))
                }
                className="url-input"
              />
              <button onClick={testConnection} className="test-button">
                Test Connection
              </button>
            </div>
            <p className="setting-description">
              URL where AnkiConnect is running (default: http://localhost:8765)
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-item">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) =>
                setSettings(prev => ({ ...prev, theme: e.target.value }))
              }
              className="theme-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <p className="setting-description">
              Choose your preferred color theme
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h2>Study Settings</h2>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoSync}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, autoSync: e.target.checked }))
                }
                className="checkbox"
              />
              Auto-sync with Anki
            </label>
            <p className="setting-description">
              Automatically sync changes with your Anki collection
            </p>
          </div>

          <div className="setting-item">
            <label htmlFor="new-cards">New cards per day</label>
            <input
              type="number"
              id="new-cards"
              value={settings.newCardsPerDay}
              onChange={(e) =>
                setSettings(prev => ({ ...prev, newCardsPerDay: parseInt(e.target.value) }))
              }
              className="number-input"
              min="0"
              max="999"
            />
            <p className="setting-description">
              Maximum number of new cards to study per day
            </p>
          </div>

          <div className="setting-item">
            <label htmlFor="review-cards">Review cards per day</label>
            <input
              type="number"
              id="review-cards"
              value={settings.reviewCardsPerDay}
              onChange={(e) =>
                setSettings(prev => ({ ...prev, reviewCardsPerDay: parseInt(e.target.value) }))
              }
              className="number-input"
              min="0"
              max="9999"
            />
            <p className="setting-description">
              Maximum number of review cards to study per day
            </p>
          </div>
        </div>

        <div className="settings-actions">
          <button onClick={handleSave} className="save-button">
            Save Settings
          </button>
        </div>
      </div>

      <style jsx>{`
        .settings {
          padding: 2rem;
          height: 100%;
          overflow: auto;
        }
        
        .settings-header {
          margin-bottom: 2rem;
        }
        
        .settings-header h1 {
          font-size: 2rem;
          font-weight: bold;
          color: var(--text-primary);
        }
        
        .settings-content {
          max-width: 600px;
        }
        
        .settings-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background-color: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
        }
        
        .settings-section h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        
        .setting-item {
          margin-bottom: 1.5rem;
        }
        
        .setting-item:last-child {
          margin-bottom: 0;
        }
        
        .setting-item label {
          display: block;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        
        .url-input-group {
          display: flex;
          gap: 0.5rem;
        }
        
        .url-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }
        
        .test-button {
          padding: 0.75rem 1rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          white-space: nowrap;
        }
        
        .test-button:hover {
          background-color: var(--primary-hover);
        }
        
        .theme-select,
        .number-input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }
        
        .number-input {
          width: 100px;
        }
        
        .checkbox {
          margin-right: 0.5rem;
        }
        
        .setting-description {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .settings-actions {
          padding-top: 2rem;
        }
        
        .save-button {
          padding: 0.75rem 2rem;
          background-color: var(--success-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-weight: 500;
          font-size: 1rem;
        }
        
        .save-button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}