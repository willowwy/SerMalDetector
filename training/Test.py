import os
import json
import numpy as np
from gensim.models import Word2Vec
import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from sklearn.preprocessing import LabelEncoder

# 可调参数
vector_size = 100  # 嵌入向量的维度
max_sequence_length = 800  # 最大序列长度，所有序列将会被填充到这个长度
model_save_path = '/home/wwy/SerMalDetector/training/word2vec_window8.model'  # 预训练Word2Vec模型路径
model_path = '/home/wwy/SerMalDetector/training/malware_detection_model.keras'  # 保存的LSTM模型路径

# 加载Word2Vec模型
w2v_model = Word2Vec.load(model_save_path)

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

# 加载LSTM模型
model = load_model(model_path, custom_objects={'AttentionLayer': AttentionLayer})

# 加载新数据
def load_api_sequences(directory):
    api_sequences = []
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            with open(os.path.join(directory, filename), 'r') as file:
                api_sequence = json.load(file)
                api_sequences.append(api_sequence)
    return api_sequences

# 预测分类
def predict_class(model, sequences, w2v_model, max_sequence_length):
    vectorized_sequences = vectorize_sequences(sequences, w2v_model, max_sequence_length)
    predictions = model.predict(vectorized_sequences)
    return predictions

# 定位恶意代码
def locate_malicious_code(model, sequence, word2vec_model, max_sequence_length):
    vectorized_sequence = vectorize_sequences([sequence], word2vec_model, max_sequence_length)[0]
    padded_sequence = np.expand_dims(vectorized_sequence, axis=0)
    attention_layer = model.layers[1]  # 获取注意力层
    attention_model = Model(inputs=model.input, outputs=attention_layer.output)
    attention_output = attention_model.predict(padded_sequence)
    attention_scores = np.mean(attention_output, axis=1).flatten()
    suspicious_indices = np.argsort(attention_scores)[-10:]  # 假设定位前10个可疑API
    suspicious_indices = [idx for idx in suspicious_indices if idx < len(sequence)]  # 确保索引在范围内
    suspicious_apis = [sequence[idx] for idx in suspicious_indices]
    return suspicious_apis

# 示例：加载新API序列进行预测和定位
new_sequences_dir = '/home/wwy/SerMalDetector/data/result'
new_sequences = load_api_sequences(new_sequences_dir)

# 预测分类
predictions = predict_class(model, new_sequences, w2v_model, max_sequence_length)
for i, pred in enumerate(predictions):
    print(f"Sequence {i} is {'malicious' if pred > 0.5 else 'benign'} with probability {pred[0]}")

# 定位恶意代码
test_sequence = new_sequences[0]  # 选择要定位的API序列
suspicious_apis = locate_malicious_code(model, test_sequence, w2v_model, max_sequence_length)
print("Suspicious APIs:", suspicious_apis)
