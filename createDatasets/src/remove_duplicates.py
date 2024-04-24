import os
import json
import logging
from collections import defaultdict

def remove_duplicates(folder_path, log_file):
    # 设置日志记录
    logging.basicConfig(filename=log_file, level=logging.INFO, format='%(message)s')

    # 用于跟踪文件内容的哈希表
    content_hash_map = defaultdict(list)

    # 遍历文件夹下的所有文件
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path) and filename.endswith('.json'):
            with open(file_path, 'r') as file:
                # 读取JSON文件内容并计算哈希值
                content = file.read()
                content_hash = hash(content)
                content_hash_map[content_hash].append(file_path)

    # 删除重复内容的文件
    for _, file_paths in content_hash_map.items():
        if len(file_paths) > 1:
            # 保留第一个文件，删除其他重复文件
            for file_path in file_paths[1:]:
                logging.info(f'Duplicate files: {", ".join(file_paths)}')
                logging.info(f'Keeping: {file_paths[0]}')
                os.remove(file_path)

# 使用示例
folder_path = '/path/to/your/folder'
log_file = 'duplicate_files.log'
remove_duplicates(folder_path, log_file)
