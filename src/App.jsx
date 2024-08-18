import React, { useState } from 'react';
import './App.css';
import Loading from './Loading/Loading';

const App = () => {
  const [postUrl, setPostUrl] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('input'); // New state to toggle between views

  const fetchComments = async () => {
    if (!postUrl) {
      alert("Please Paste the Link");
      return;
    }

    setLoading(true);
    const apiUrl = 'https://api.apify.com/v2/acts/apify~instagram-comment-scraper/run-sync-get-dataset-items';
    const token = 'apify_api_UV83Z7PL6BAGFkvfuO22YDWnNhwBBM0LEJkI'; // Your Apify API token
    const input = {
      directUrls: [postUrl],
      resultsType: 'comments'
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();

      // Send comments to Flask backend to detect hate speech
      const hateSpeechResponse = await fetch('http://localhost:5050/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comments: data })
      });

      const hateComments = await hateSpeechResponse.json();
      setComments(hateComments);
      setView('comments'); // Switch to comments view
      
    } catch (error) {
      console.error('Error fetching comments:', error);
      alert("Unable to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {loading ? (
        <Loading />
      ) : (
        <div className="container">
          {view === 'input' ? (
            <>
              <h1>Instagram Comment Fetcher</h1>
              <input
                type="text"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="Enter Instagram Post URL"
              />
              <button onClick={fetchComments} disabled={loading}>
                Fetch Comments
              </button>
            </>
          ) : (
            <>
              <div id="comments" className='comments'>
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div key={index}>
                      <p>
                        <a 
                          href={`https://www.instagram.com/${comment.username}/`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {comment.username}
                        </a>: {comment.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No hate comments found</p>
                )}
              </div>
              <button onClick={() => setView('input')}>
                Back to Input
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
