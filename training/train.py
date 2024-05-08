import os
import json
import numpy as np
from gensim.models import Word2Vec
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, precision_score, recall_score, f1_score
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Embedding, Bidirectional
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Function to load data and labels from a directory
def load_data_from_directory(directory, label):
    features = []
    labels = []
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            file_path = os.path.join(directory, filename)
            with open(file_path, 'r') as file:
                data = json.load(file)
                features.append(data)
                labels.append(label)
    return features, labels

# Directories containing benign and malicious data
ben_directory = '/home/wwy/SerMalDetector/datasets/BenPac/features'
mal_directory = '/home/wwy/SerMalDetector/datasets/MalinBenPac/features'

# Load benign and malicious data
ben_features, ben_labels = load_data_from_directory(ben_directory, 0)
mal_features, mal_labels = load_data_from_directory(mal_directory, 1)

# Combine benign and malicious data
features = ben_features + mal_features
labels = ben_labels + mal_labels

# Train a Word2Vec model using Skip-Gram
word2vec_model = Word2Vec(sentences=features, vector_size=102, window=5, sg=1, min_count=1, workers=4)
word2vec_model.save("word2vec_skipgram.model")

# Convert words to vectors using the trained Word2Vec model
def text_to_sequence(text, model):
    return [model.wv[word] for word in text if word in model.wv]

sequences = [text_to_sequence(text, word2vec_model) for text in features]

# Padding sequences to have the same length
max_length = max(len(seq) for seq in sequences)
padded_sequences = pad_sequences(sequences, maxlen=max_length, dtype='float32', padding='post', value=0.0)

# Convert labels to numpy array
labels = np.array(labels)

# Split dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(padded_sequences, labels, test_size=0.2, random_state=42)

# Create the Bi-LSTM model
model = Sequential([
    Bidirectional(LSTM(50, return_sequences=False), input_shape=(max_length, 102)),
    Dense(1, activation='sigmoid')
])

# Compile the model
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Train the model
model.fit(X_train, y_train, epochs=10, batch_size=32, validation_split=0.2)

# Predict and evaluate the model
y_pred = (model.predict(X_test) > 0.5).astype("int32")
report = classification_report(y_test, y_pred, target_names=['Benign', 'Malicious'])
print(report)

# Print formatted report
accuracy = np.mean(y_test == y_pred)
print(f"| ***准确率***  | ***{accuracy:.2f}*** |")
print(f"| ----------------- | ------------- |")
print(f"| ***精度***    | ***{precision_score(y_test, y_pred):.2f}*** |")
print(f"| ***召回率***  | ***{recall_score(y_test, y_pred):.2f}*** |")
print(f"| ***F1 分数*** | ***{f1_score(y_test, y_pred):.2f}*** |")
