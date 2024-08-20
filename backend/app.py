import pandas as pd
from flask import Flask, request, jsonify
import re
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from tensorflow.keras.layers import TextVectorization

# Load the dataset and initialize the TextVectorization layer
df = pd.read_csv('comments.csv')
X = df['comment_text']

MAX_FEATURES = 200000  # Number of words in the vocab

vectorizer = TextVectorization(max_tokens=MAX_FEATURES,
                               output_sequence_length=1800,
                               output_mode='int')

vectorizer.adapt(X.values)

# Initialize Flask app and allow CORS
app = Flask(__name__)
CORS(app)

# Load the pre-trained model
model = tf.keras.models.load_model('toxicity.h5')

# Function to preprocess text into sentences
def preprocess_text(text):
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
    return sentences

# Endpoint for hate speech detection
@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.get_json()
        if 'text' not in data:
            return jsonify({'error': 'Text input is required.'}), 400

        text = data['text']
        sentences = preprocess_text(text)
        preprocessed_sentences = vectorizer(sentences)

        # Predict toxicity for all sentences in one batch
        predictions = model.predict(np.array(preprocessed_sentences))
        is_toxic = any(prediction[0] > 0.5 for prediction in predictions)  # Adjust based on your model's output shape

        return jsonify({'toxic': is_toxic})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint for text transcription or additional functionality
@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        data = request.get_json()
        if 'text' not in data:
            return jsonify({'error': 'Text input is required.'}), 400

        text = data['text']
        preprocessed_text = vectorizer([text])

        # Predict toxicity for the given text
        predictions = model.predict(np.array(preprocessed_text))
        is_toxic = any(prediction[0] > 0.5 for prediction in predictions)

        return jsonify({"message": "Text received", "toxic": is_toxic})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
