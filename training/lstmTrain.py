import os
import json
import numpy as np
from gensim.models import Word2Vec
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, Bidirectional
from tensorflow.keras.callbacks import Callback
from sklearn.metrics import f1_score, precision_score, recall_score, confusion_matrix, accuracy_score
from sklearn.model_selection import train_test_split

# 可调参数
mal_dir = '/home/wwy/datasets/MalinBenPac/features'  # 恶意API序列的文件夹路径
ben_dir = '/home/wwy/datasets/BenPac/features'  # 正常API序列的文件夹路径
vector_size = 100  # 嵌入向量的维度 已ok
max_sequence_length = 800  # 最大序列长度，所有序列将会被填充到这个长度 已ok
model_save_path = '/home/wwy/SerMalDetector/training/word2vec_window8.model'  # 训练好模型的保存路径

# LSTM模型参数
#model.fit(X_train, np.array(y_train), epochs=10, batch_size=32, validation_data=(X_test, np.array(y_test)), callbacks=[metrics])
lstm_units = 64  # LSTM层神经元数量
lstm_return_sequences = False  # LSTM层是否返回完整序列
lstm_activation = 'tanh'  # LSTM层激活函数
lstm_recurrent_activation = 'sigmoid'  # LSTM层循环激活函数
lstm_dropout = 0.1  # LSTM层输入数据的丢弃比率
lstm_recurrent_dropout = 0.1  # LSTM层循环连接的丢弃比率
epochs_times = 17
BatchSize=32

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
labels = [1] * len(malicious_sequences) + [0] * len(benign_sequences)  # 1表示恶意，0表示正常

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

vectorized_sequences = vectorize_sequences(all_sequences, w2v_model, max_sequence_length)

# 数据集划分
X_train, X_test, y_train, y_test = train_test_split(vectorized_sequences, labels, test_size=0.2, random_state=42, stratify=labels)

# 构建Bi-LSTM模型
def create_model(input_shape):
    inputs = Input(shape=input_shape)
    lstm_out = Bidirectional(LSTM(units=lstm_units, 
                                  return_sequences=lstm_return_sequences,
                                  activation=lstm_activation,
                                  recurrent_activation=lstm_recurrent_activation,
                                  dropout=lstm_dropout,
                                  recurrent_dropout=lstm_recurrent_dropout))(inputs)
    outputs = Dense(1, activation='sigmoid')(lstm_out)
    
    model = Model(inputs, outputs)
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

input_shape = (max_sequence_length, vector_size)
model = create_model(input_shape)

# 自定义回调函数计算F1分数等指标
class Metrics(Callback):
    def __init__(self, validation_data):
        super(Metrics, self).__init__()
        self.validation_data = validation_data
        self.val_f1s = []
        self.val_recalls = []
        self.val_precisions = []
        self.val_accuracies = []
        self.val_tp = []
        self.val_fp = []

    def on_epoch_end(self, epoch, logs=None):
        val_predict = (np.asarray(self.model.predict(self.validation_data[0]))).round()
        val_targ = self.validation_data[1]
        _val_f1 = f1_score(val_targ, val_predict)
        _val_recall = recall_score(val_targ, val_predict)
        _val_precision = precision_score(val_targ, val_predict)
        _val_accuracy = accuracy_score(val_targ, val_predict)
        cm = confusion_matrix(val_targ, val_predict)
        _val_tp = cm[1, 1]
        _val_fp = cm[0, 1]
        
        self.val_f1s.append(_val_f1)
        self.val_recalls.append(_val_recall)
        self.val_precisions.append(_val_precision)
        self.val_accuracies.append(_val_accuracy)
        self.val_tp.append(_val_tp)
        self.val_fp.append(_val_fp)
        
        print(f" — val_f1: {_val_f1:.4f} — val_precision: {_val_precision:.4f} — val_recall {_val_recall:.4f} — val_accuracy {_val_accuracy:.4f}")

    def on_train_end(self, logs=None):
        print("\nFinal metrics:")
        print(f"F1 Scores: {[f'{score:.2f}' for score in self.val_f1s]}")
        print(f"Precisions: {[f'{precision:.2f}' for precision in self.val_precisions]}")
        print(f"Recalls: {[f'{recall:.2f}' for recall in self.val_recalls]}")
        print(f"Accuracies: {[f'{accuracy:.2f}' for accuracy in self.val_accuracies]}")
        print(f"True Positives: {[f'{tp:.2f}' for tp in self.val_tp]}")
        print(f"False Positives: {[f'{fp:.2f}' for fp in self.val_fp]}")


# 训练模型
metrics = Metrics(validation_data=(X_test, np.array(y_test)))
model.fit(X_train, np.array(y_train), epochs=epochs_times, batch_size=BatchSize, validation_data=(X_test, np.array(y_test)), callbacks=[metrics])

# 保存模型
model.save('/home/wwy/SerMalDetector/training/malware_detection_model.keras')

# # 示例：加载模型并进行预测
# loaded_model = tf.keras.models.load_model('/home/wwy/SerMalDetector/training/malware_detection_model.keras')

# # 示例API序列
# new_sequences = load_api_sequences('/path/to/new/api/sequences')
# vectorized_new_sequences = vectorize_sequences(new_sequences, w2v_model, max_sequence_length)
# predictions = loaded_model.predict(vectorized_new_sequences)

# for i, pred in enumerate(predictions):
#     print(f"Sequence {i} is {'malicious' if pred > 0.5 else 'benign'} with probability {pred[0]}")
