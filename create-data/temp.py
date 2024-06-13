import os
import tarfile
# Path to the directory containing the malicious compressed packages
data_dir = '/home/wwy/MalnpmDB/MalnpmDB/ben'
exist_dir = '/home/wwy/datasets/MalinBenPac/longBenSrc'
# Path to the directory containing short malicious source files
output_dir = '/home/wwy/datasets/BenPac/longBenSrc'

# 路径设置
a_folder_path = '/home/wwy/MalnpmDB/MalnpmDB/ben'
b_folder_path = '/home/wwy/datasets/BenPac/longBenSrc'
c_folder_path = '/home/wwy/datasets/MalinBenPac/longBenSrc'

# 获取c文件夹中的现有文件夹名
existing_dirs_in_c = {name for name in os.listdir(c_folder_path) if os.path.isdir(os.path.join(c_folder_path, name))}

# 遍历a文件夹中的.tar.gz文件
for filename in os.listdir(a_folder_path):
    if filename.endswith('.tar.gz'):
        tar_name = filename[:-7]  # 去掉.tar.gz后缀的文件夹名

        # 如果c文件夹中不存在该文件夹名，则进行解压
        if tar_name not in existing_dirs_in_c:
            tar_path = os.path.join(a_folder_path, filename)
            with tarfile.open(tar_path, 'r:gz') as tar:
                tar.extractall(b_folder_path)
            print(f'Extracted {filename} to {b_folder_path}')
        else:
            print(f'Skipped {filename} as {tar_name} exists in {c_folder_path}')
