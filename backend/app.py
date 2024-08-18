import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from tensorflow.keras.layers import TextVectorization

app = Flask(__name__)
CORS(app)

# Load your model
model = tf.keras.models.load_model('toxicity.h5')

MAX_FEATURES = 200000  # Number of words in the vocabulary
vectorizer = TextVectorization(max_tokens=MAX_FEATURES,
                               output_sequence_length=1800,
                               output_mode='int')

# Adapt the vectorizer to some initial text or a dummy example
vectorizer.adapt(["example text"])  # You can adapt this to any short dummy text

def preprocess_text(text):
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
    return sentences

@app.route('/detect', methods=['POST'])
def detect():
    data = request.get_json()
    comments = data['comments']
    
    hate_comments = []
    
    for comment in comments:
        sentences = preprocess_text(comment['text'])
        preprocessed_sentences = [vectorizer([sentence]) for sentence in sentences]
        
        # Predict toxicity for all sentences in the comment
        predictions = model.predict(np.vstack(preprocessed_sentences))
        is_hate_speech = any(prediction[0] > 0.5 for prediction in predictions)  # Adjust based on your model's output shape

        if is_hate_speech:
            hate_comments.append({
                "username": comment['ownerUsername'],
                "text": comment['text']
            })

    return jsonify(hate_comments)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
