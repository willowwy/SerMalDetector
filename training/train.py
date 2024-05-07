import torch
import torch.nn as nn
import numpy as np
from torchtext.vocab import GloVe
from glob import glob
import json
import os

# 定义LSTM模型
class LSTMModel(nn.Module):
    def __init__(self, embedding_dim, hidden_dim, output_dim):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.hidden2tag = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        tag_space = self.hidden2tag(lstm_out[:, -1, :])  # 只取序列的最后一个输出
        return tag_space

# 加载GloVe模型
glove = GloVe(name='6B', dim=100)

def process_file(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # 转换文本为向量
    embeddings = torch.stack([torch.tensor(glove.get_vecs_by_tokens(label.lower(), True)) for label in data])
    return embeddings.unsqueeze(0)  # 增加批次维度

def main():
    files = glob('result/*.json')
    model = LSTMModel(100, 50, 10)  # 假设输出维度为10
    model.eval()  # 设置为评估模式

    results = []
    for file in files:
        embeddings = process_file(file)
        output = model(embeddings)
        results.append(output)

    # 处理结果，例如保存或进一步分析
    print("处理完成")

if __name__ == '__main__':
    main()
