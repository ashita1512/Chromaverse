import React, { useState, useEffect } from 'react';

// This is the main component for the logged-in user experience.
function HomePage({ token }) {
  // State for the generator form
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photographic');
  
  // State for the results and history
  const [history, setHistory] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
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
    setCurrentImage(null);

    try {
      const response = await fetch('http://localhost:8000/generate-image/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: prompt, style: style }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Something went wrong');
      }
      
      const newCreation = await response.json();
      setHistory([newCreation, ...history]);
      setCurrentImage(newCreation);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="homepage-layout">
      {/* --- Column 1: Generator Controls --- */}
      <div className="generator-column">
        <form className="generator-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="prompt">Enter your prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A majestic cat wearing a crown"
              rows="4"
              required
            />
          </div>

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

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Verse'}
          </button>
        </form>
      </div>

      {/* --- Column 2: Main Image Viewer --- */}
      <div className="viewer-column">
        <div className="viewer-content">
          {isLoading && <div className="loading-spinner"></div>}
          {error && <div className="error-message">Error: {error}</div>}
          
          {!isLoading && !error && currentImage && (
            <div className="image-result">
              <img src={`http://localhost:8000/images/${currentImage.image_filename}`} alt={currentImage.prompt} />
              <p className="image-prompt-display">{currentImage.prompt}</p>
            </div>
          )}
          
          {!isLoading && !error && !currentImage && (
            <div className="viewer-placeholder">
              <p>Your creation will appear here.</p>
              <span>Click 'Generate Verse' or select an item from your history.</span>
            </div>
          )}
        </div>
      </div>

      {/* --- Column 3: History --- */}
      <div className="history-column">
        <h2>Generated Verse</h2>
        <div className="history-list">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="history-item" onClick={() => setCurrentImage(item)}>
                <img src={`http://localhost:8000/images/${item.image_filename}`} alt={item.prompt} />
                <p>{item.prompt}</p>
              </div>
            ))
          ) : (
            <p className="no-history">Your generated images will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
