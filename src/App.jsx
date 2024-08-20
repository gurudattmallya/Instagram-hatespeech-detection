import React, { useState } from 'react';
import './App.css'; // Assuming you have a global CSS file
import Loading from './Loading/Loading';

const App = () => {
  const [postUrl, setPostUrl] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('input');
  const [speechResult, setSpeechResult] = useState(''); // For speech detection
  const [isToxic, setIsToxic] = useState(false);

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

  const startSpeechDetection = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setSpeechResult(transcript);

      try {
        const response = await fetch('http://localhost:5050/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: transcript })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        setIsToxic(result.toxic); // Update isToxic state based on backend response
      } catch (error) {
        console.error('Error detecting hate speech:', error);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
    };

    recognition.onend = () => {
      console.log("Speech Recognition ended.");
    };

    recognition.start();
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

              {/* Integrated HTML component */}
              <div className="speaker" style={{ display: 'flex', justifyContent: 'space-between', width: '13rem', boxShadow: '0 0 13px #0000003d', borderRadius: '5px' }}>
                <p id="action" style={{ color: 'grey', fontWeight: '800', padding: '0', paddingLeft: '2rem' }}>{speechResult}</p>
                <button id="start" style={{ border: 'transparent', padding: '0 0.5rem' }} onClick={startSpeechDetection}>
                  Speech
                </button>
              </div>
              {speechResult && (
                <p style={{ color: isToxic ? 'red' : 'green' }}>
                  {isToxic ? 'Hate speech detected!' : 'No hate speech detected.'}
                </p>
              )}
              <h3 id="output" className="hide"></h3>
            </>
          ) : (
            <>
              <div id="comments" className="comments">
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
