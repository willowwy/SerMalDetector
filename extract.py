import os
import tarfile
import sys
import traceback


def decompress_packages(dataset_dir_path: str):
    # 定义目标解压路径
    decompressed_path = os.path.abspath("data/.cache")
    # 确保目标解压路径存在
    os.makedirs(decompressed_path, exist_ok=True)

    # 遍历dataset_dir_path下的所有文件
    for file_name in os.listdir(dataset_dir_path):
        # 检查文件是否为.tar.gz或.tgz压缩文件
        if file_name.endswith(".tar.gz") or file_name.endswith(".tgz"):
            # 定义完整的文件路径
            file_path = os.path.join(dataset_dir_path, file_name)
            try:
                # 打开压缩文件
                with tarfile.open(file_path, "r:*") as tar:
                    # 解压
                    tar.extractall(path=decompressed_path)
                print(f"Successfully decompressed {file_name}")
            except Exception as e:
                print(f"Error decompressing {file_name}: {e}")


def run_npm_start():
    try:
        cwd = os.getcwd()
        os.chdir("feature-extract")
        # 执行npm start命令
        os.system(
            f"npm run start -- -d {dataset_dir_path} {call_graph_dir_path} {feature_pos_dir_path} {sequential_feature_dir_path}"
        )
        os.chdir(cwd)
    except Exception:
        print(f"Error: Extract feature of dataset {dataset_name} failed.")
        traceback.print_exc()
    finally:
        # 返回原工作目录
        os.chdir("..")


if __name__ == "__main__":
    # dataset that needs to be decompressed
    dataset_dir_path = "data/datasets/test"
    dataset_name = os.path.basename(dataset_dir_path)
    dataset_dir_path = os.path.abspath(dataset_dir_path)

    # dir to store the call graphs
    call_graph_dir_path = "data/call-graphs"
    call_graph_dir_path = os.path.abspath(
        os.path.join(call_graph_dir_path, dataset_name)
    )
    os.makedirs(call_graph_dir_path, exist_ok=True)
    # dir to store the features' positions
    feature_pos_dir_path = "data/feature-positions/"
    feature_pos_dir_path = os.path.abspath(
        os.path.join(feature_pos_dir_path, dataset_name)
    )
    os.makedirs(feature_pos_dir_path, exist_ok=True)
    # dir to store the extracted sequential features
    sequential_feature_dir_path = "data/features"
    sequential_feature_dir_path = os.path.abspath(
        os.path.join(sequential_feature_dir_path, dataset_name)
    )
    os.makedirs(sequential_feature_dir_path, exist_ok=True)

    # dir to store the cache
    cache_dir = "data/.cache"
    cache_dir = os.path.abspath(os.path.join(cache_dir, dataset_name))
    # 如果命令行参数为--gz，则解压数据集到cache路径下
    if len(sys.argv) > 1 and sys.argv[1] == "--gz":
        if not os.path.exists(cache_dir + dataset_name):
            os.makedirs(cache_dir)
        decompress_packages(dataset_dir_path, cache_dir)
        dataset_dir_path = cache_dir

    # 执行npm start
    run_npm_start()
