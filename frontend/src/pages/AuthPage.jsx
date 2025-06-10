import React, { useState } from 'react';

const AuthPage = ({ setToken }) => {
  const [view, setView] = useState('login'); 
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed.');
      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await fetch('http://localhost:8000/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Signup failed.');
      
      // THIS IS THE CHANGE: Set a success message instead of using alert()
      setMessage('Signup complete. Now please log in.');
      setView('login'); // Switch to the login view
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await fetch('http://localhost:8000/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'An error occurred.');
      setMessage(data.message);
      setView('login');
    } catch (err) {
       setError(err.message);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <h1 className="auth-title">Chromaverse</h1>
        <div className="auth-form">

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotSubmit}>
              <h2>Reset Password</h2>
              <div className="form-group">
                <label>Enter your registered Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email address" />
              </div>
              <button type="submit">Send Reset Link</button>
              <button type="button" className="toggle-auth" onClick={() => setView('login')}>Back to Login</button>
            </form>
          )}

          {/* LOGIN VIEW */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <h2>Login</h2>
              {/* This line will now display the success message from signup */}
              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit">Login</button>
              <div className="auth-links">
                <button type="button" className="link-button" onClick={() => setView('forgot')}>Forgot password?</button>
                <button type="button" className="link-button" onClick={() => setView('signup')}>Need an account? Sign Up</button>
              </div>
            </form>
          )}

          {/* SIGNUP VIEW */}
          {view === 'signup' && (
            <form onSubmit={handleSignupSubmit}>
              <h2>Sign Up</h2>
              {error && <p className="error-message">{error}</p>}
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit">Sign Up</button>
              <button type="button" className="toggle-auth" onClick={() => setView('login')}>Have an account? Login</button>
            </form>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
