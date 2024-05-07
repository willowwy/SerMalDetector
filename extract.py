import os
import tarfile

def decompress_packages(dataset_dir_path: str):
    # 定义目标解压路径
    decompressed_path = os.path.abspath('data/.cache')
    # 确保目标解压路径存在
    os.makedirs(decompressed_path, exist_ok=True)

    # 遍历dataset_dir_path下的所有文件
    for file_name in os.listdir(dataset_dir_path):
        # 检查文件是否为.tar.gz或.tgz压缩文件
        if file_name.endswith('.tar.gz') or file_name.endswith('.tgz'):
            # 定义完整的文件路径
            file_path = os.path.join(dataset_dir_path, file_name)
            try:
                # 打开压缩文件
                with tarfile.open(file_path, 'r:*') as tar:
                    # 解压
                    tar.extractall(path=decompressed_path)
                print(f'Successfully decompressed {file_name}')
            except Exception as e:
                print(f'Error decompressing {file_name}: {e}')

def run_npm_start():
    try:
        # 更改当前工作目录
        os.chdir('feature-extract')
        # 执行npm start命令
        os.system('npm run start')
    except Exception as e:
        print(f'Error executing npm start: {e}')
    finally:
        # 返回原工作目录
        os.chdir('..')

if __name__ == '__main__':
    # 指定数据集目录路径
    dataset_dir_path = '/home/wwy/SerMalDetector/MalnpmDB/MalnpmDB/ben'
    # 解压操作
    decompress_packages(dataset_dir_path)
    # 执行npm start
    run_npm_start()
