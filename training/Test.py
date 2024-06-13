import os
import json
import numpy as np
from gensim.models import Word2Vec
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.metrics import f1_score, precision_score, recall_score, accuracy_score

# 路径设置
model_save_path = '/home/wwy/SerMalDetector/training/malware_detection_model.keras'
w2v_model_path = '/home/wwy/SerMalDetector/training/word2vec_window10.model'
test_data_dir = '/home/wwy/SerMalDetector/data/result/testb'  # 恶意数据集目录
# /home/wwy/detect-malicious-npm-package-with-machine-learning/datasets/preprocessed-datasets/benign/testb
# 可调参数
vector_size = 100
max_sequence_length = 800

# 加载Word2Vec模型
w2v_model = Word2Vec.load(w2v_model_path)

# 将API序列加载到文件夹中
def load_api_sequences(directory):
    api_sequences = []
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            with open(os.path.join(directory, filename), 'r') as file:
                api_sequence = json.load(file)
                api_sequences.append(api_sequence)
    return api_sequences

# 将API序列转换为向量序列，并填充到相同长度
def vectorize_sequences(sequences, model, max_length):
    vectorized_sequences = []
    for seq in sequences:
        vectorized_seq = [model.wv[api] if api in model.wv else np.zeros(model.vector_size) for api in seq]
        # 填充或截断序列
        if len(vectorized_seq) < max_length:
            vectorized_seq.extend([np.zeros(model.vector_size)] * (max_length - len(vectorized_seq)))
        else:
            vectorized_seq = vectorized_seq[:max_length]
        vectorized_sequences.append(vectorized_seq)
    return np.array(vectorized_sequences)

# 加载测试数据
test_sequences = load_api_sequences(test_data_dir)
vectorized_test_sequences = vectorize_sequences(test_sequences, w2v_model, max_sequence_length)

# 加载训练好的模型
model = load_model(model_save_path)

# 进行预测
predictions = model.predict(vectorized_test_sequences)

# 预测结果阈值设置
threshold = 0.5
predicted_classes = (predictions > threshold).astype("int32")

# 输出预测结果
for i, prediction in enumerate(predicted_classes):
    print(f"Sample {i}: Predicted Class: {'malicious' if prediction[0] == 1 else 'benign'}, Prediction Probability: {predictions[i][0]:.4f}")

# 如果需要计算性能指标（假设数据集全是恶意包）
true_labels = np.ones(len(predicted_classes))  # 全部实际为恶意包
accuracy = accuracy_score(true_labels, predicted_classes)
precision = precision_score(true_labels, predicted_classes)
recall = recall_score(true_labels, predicted_classes)
f1 = f1_score(true_labels, predicted_classes)

# 输出性能指标
print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1 Score: {f1:.4f}")
