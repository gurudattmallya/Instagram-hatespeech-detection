import React, { useState } from 'react';
import './App.css'
function App() {
  const [postUrl, setPostUrl] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!postUrl) {
      alert('Please enter an Instagram post URL');
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
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      alert('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      
      <div className="container">
      <h1>Instagram Comment Fetcher</h1>
      <input
        type="text"
        value={postUrl}
        onChange={(e) => setPostUrl(e.target.value)}
        placeholder="Enter Instagram Post URL"
      />
      <button onClick={fetchComments} disabled={loading}>
        {loading ? 'Fetching...' : 'Fetch Comments'}
      </button>
      
      </div>
      <div id="comments">
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <div key={index}>
              <p>{comment.text || 'No text'}</p>
            </div>
          ))
        ) : (
          <p>No comments found</p>
        )}
      </div>
    </div>
      
  );
}

export default App;
