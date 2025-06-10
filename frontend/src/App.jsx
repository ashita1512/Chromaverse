import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import './App.css';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('chromaverse-token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleSetToken = (newToken) => {
    setToken(newToken);
    localStorage.setItem('chromaverse-token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('chromaverse-token');
  };

  // If there's no token, show the centered AuthPage
  if (!token) {
    return <AuthPage setToken={handleSetToken} />;
  }

  // If there IS a token, show the main application layout
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Chromaverse</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      <HomePage token={token} />
    </div>
  );
}

export default App;
