import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import './App.css';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check local storage for a token when the app loads
    const storedToken = localStorage.getItem('chromaverse-token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleSetToken = (newToken) => {
    setToken(newToken);
    // Store the token in local storage to persist login
    localStorage.setItem('chromaverse-token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('chromaverse-token');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Chromaverse</h1>
        {token && <button onClick={handleLogout} className="logout-button">Logout</button>}
      </header>
      
      {token ? (
        <HomePage token={token} />
      ) : (
        <AuthPage setToken={handleSetToken} />
      )}
    </div>
  );
}

export default App;

