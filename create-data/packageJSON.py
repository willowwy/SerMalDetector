import os
import json
import csv

# 定义存储数据的目录
data_dir = '/home/wwy/Datasets/MalinBen/.decompressed-packages'
node_output_file = '../nodeJSON.csv'

# 准备存储提取数据的列表
curl_data = []
node_data = []
other_data = []

# 遍历data目录下的所有子目录
for dirname in os.listdir(data_dir):
    dirpath = os.path.join(data_dir, dirname)
    if os.path.isdir(dirpath):
        # 构建package.json的完整路径
        package_json_path = os.path.join(dirpath,'package','package.json')
        try:
            # 读取package.json文件
            with open(package_json_path, 'r') as file:
                package_json = json.load(file)
                scripts = package_json.get('scripts', {})
                # 仅保留包含"install"的脚本
                filtered_scripts = {key: value for key, value in scripts.items() if 'install' in key}

                # 对脚本进行分类
                for script, command in filtered_scripts.items():
                    if 'node' in command:
                        node_data.append([dirname, json.dumps({script: command})])

        except Exception as e:
            print(f'Error reading {package_json_path}: {e}')

# 写入NodeJSON.csv
with open(node_output_file, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['Directory', 'Node Scripts'])  
    writer.writerows(node_data)  # 写入数据

print(f'ALL scripts have been written to {node_output_file}')

