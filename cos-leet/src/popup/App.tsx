import React, { useEffect, useState } from 'react';
import { ApiHandler } from '../handlers/ApiHandler';
import './App.css';

const EXTENSION_VERSION = '1.0.0';

export const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    ApiHandler.getApiKey().then((key) => {
      if (key) {
        setApiKey(key);
        setInputValue(key);
      }
    });
  }, []);

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setErrorMessage('API key cannot be empty');
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    try {
      await ApiHandler.setApiKey(trimmed);
      setApiKey(trimmed);
      setIsEditing(false);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
    } catch {
      setErrorMessage('Failed to save API key');
      setTimeout(() => setErrorMessage(null), 2500);
    }
  };

  const handleRemove = async () => {
    try {
      await ApiHandler.setApiKey('');
      setApiKey('');
      setInputValue('');
      setIsEditing(false);
    } catch {
      setErrorMessage('Failed to clear key');
      setTimeout(() => setErrorMessage(null), 2500);
    }
  };

  const isConnected = Boolean(apiKey);

  return (
    <div className="extension-container">
      {/* Header */}
      <header className="extension-header">
        <div className="brand-group">
          <div className="brand-badge">
            <span>COS</span>
          </div>
          <div className="brand-meta">
            <h1 className="brand-title">Career OS</h1>
            <p className="brand-subtitle">LeetCode Sync</p>
          </div>
        </div>

        {/* Connection status pill */}
        <div className={`status-pill ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-indicator"></span>
          <span className="status-text">{isConnected ? 'Connected' : 'Not Set'}</span>
        </div>
      </header>

      {/* Main Form */}
      <main className="extension-body">
        <div className="input-group">
          <label htmlFor="apiKeyInput" className="input-label">
            Backend API Key
          </label>

          {isConnected && !isEditing ? (
            <div className="key-preview-card">
              <span className="key-masked">
                ••••••••••••{apiKey.length > 4 ? apiKey.slice(-4) : apiKey}
              </span>
              <div className="key-actions">
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-text btn-danger"
                  onClick={handleRemove}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="key-input-container">
              <input
                id="apiKeyInput"
                type="password"
                className="key-input"
                placeholder="Paste API Key (Bearer Token)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus={isEditing}
              />
              <div className="action-buttons">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSave}
                >
                  {savedStatus ? 'Saved!' : 'Save Key'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setInputValue(apiKey);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feedback banners */}
        {savedStatus && (
          <div className="alert-badge alert-success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Saved!</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert-badge alert-error">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="info-card">
          <p className="info-text">
            Automatically syncs Accepted LeetCode submissions directly to your custom API endpoint.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="extension-footer">
        <span className="target-domain">api.yourdomain.com</span>
        <span className="version-tag">v{EXTENSION_VERSION}</span>
      </footer>
    </div>
  );
};

export default App;
