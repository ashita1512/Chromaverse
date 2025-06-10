import React, { useState, useEffect } from 'react';
import { Image, Music } from 'lucide-react'; // Using icons for a professional look

// Main component for the logged-in user experience
function HomePage({ token }) {
  // State to manage the active generator ('image' or 'music')
  const [activeTab, setActiveTab] = useState('image');
  
  // State for the form inputs
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photographic');
  
  // State for results and history
  const [history, setHistory] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Fetch History when the component loads ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const response = await fetch('http://localhost:8000/history/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Could not fetch history.');
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchHistory();
  }, [token]);

  // --- Handle Form Submission ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setCurrentItem(null);

    // Determine which API endpoint to call based on the active tab
    const isImage = activeTab === 'image';
    const endpoint = isImage ? '/generate-image/' : '/generate-music/';
    const body = { text: prompt, style: isImage ? style : null };

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Something went wrong');
      }
      
      const newCreation = await response.json();
      setHistory([newCreation, ...history]);
      setCurrentItem(newCreation);
      setPrompt(''); // Clear prompt after successful generation
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- UI Rendering ---

  const renderGenerator = () => (
    <form className="generator-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="prompt">{activeTab === 'image' ? 'Describe your image' : 'Describe your music'}</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={activeTab === 'image' ? "e.g., A majestic cat wearing a crown" : "e.g., A calm, melancholic piano piece"}
          rows="4"
          required
        />
      </div>

      {activeTab === 'image' && (
        <div className="form-group">
          <label htmlFor="style">Choose a style</label>
          <select id="style" value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="photographic">Photographic</option>
            <option value="anime">Anime</option>
            <option value="digital-art">Digital Art</option>
            <option value="comic-book">Comic Book</option>
            <option value="fantasy-art">Fantasy Art</option>
            <option value="cinematic">Cinematic</option>
          </select>
        </div>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Generating...' : `Generate ${activeTab === 'image' ? 'Verse' : 'Tune'}`}
      </button>
    </form>
  );

  const renderViewer = () => {
    if (isLoading) return <div className="loading-spinner"></div>;
    if (error) return <div className="error-message">Error: {error}</div>;
    if (currentItem) {
      if (currentItem.type === 'image') {
        return (
          <div className="image-result">
            <img src={`http://localhost:8000/images/${currentItem.filename}`} alt={currentItem.prompt} />
            <p className="image-prompt-display">{currentItem.prompt}</p>
          </div>
        );
      }
      if (currentItem.type === 'music') {
        return (
          <div className="audio-result">
            <Music size={128} className="music-icon" />
            <p className="image-prompt-display">{currentItem.prompt}</p>
            <audio controls autoPlay key={currentItem.filename} src={`http://localhost:8000/music/${currentItem.filename}`}>
                Your browser does not support the audio element.
            </audio>
          </div>
        );
      }
    }
    return (
      <div className="viewer-placeholder">
        <p>Your creation will appear here.</p>
        <span>Click 'Generate' or select an item from your history.</span>
      </div>
    );
  };

  return (
    <div className="homepage-layout">
      {/* --- Column 1: Generator Controls --- */}
      <div className="generator-column">
        <div className="tabs">
          <button className={`tab-button ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>
            <Image size={18} /> Create Art
          </button>
          <button className={`tab-button ${activeTab === 'music' ? 'active' : ''}`} onClick={() => setActiveTab('music')}>
            <Music size={18} /> Compose Music
          </button>
        </div>
        {renderGenerator()}
      </div>

      {/* --- Column 2: Main Viewer --- */}
      <div className="viewer-column">
        <div className="viewer-content">
          {renderViewer()}
        </div>
      </div>

      {/* --- Column 3: History --- */}
      <div className="history-column">
        <h2>Generated Verse</h2>
        <div className="history-list">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="history-item" onClick={() => setCurrentItem(item)}>
                {item.type === 'image' ? (
                  <img src={`http://localhost:8000/images/${item.filename}`} alt={item.prompt} />
                ) : (
                  <div className="history-music-icon"><Music size={48} /></div>
                )}
                <p>{item.prompt}</p>
              </div>
            ))
          ) : (
            <p className="no-history">Your generated creations will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
