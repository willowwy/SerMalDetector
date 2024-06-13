import os
import json
import numpy as np
from gensim.models import Word2Vec

# 可调参数
mal_dir = '/home/wwy/datasets/MalinBenPac/features'  # 恶意API序列的文件夹路径
ben_dir = '/home/wwy/datasets/BenPac/features'  # 正常API序列的文件夹路径
vector_size = 100  # 嵌入向量的维度
window_size = 10  # 上下文窗口的大小 #5 88
min_count = 1  # 最小出现频次
sg = 1  # 1表示使用Skip-Gram模型，0表示使用CBOW模型
workers = 8  # 并行训练使用的线程数
model_save_path = '/home/wwy/SerMalDetector/training/word2vec_window10.model'  # 训练好模型的保存路径

# 加载API序列
def load_api_sequences(directory):
    api_sequences = []
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            with open(os.path.join(directory, filename), 'r') as file:
                api_sequence = json.load(file)
                api_sequences.append(api_sequence)
    return api_sequences

# 将API序列加载到两个文件夹中
malicious_sequences = load_api_sequences(mal_dir)
benign_sequences = load_api_sequences(ben_dir)

# 合并所有序列以便于训练
all_sequences = malicious_sequences + benign_sequences

# 训练Word2Vec模型
model = Word2Vec(
    sentences=all_sequences, 
    vector_size=vector_size, 
    window=window_size, 
    min_count=min_count, 
    sg=sg, 
    workers=workers
)

# 保存模型
model.save(model_save_path)



