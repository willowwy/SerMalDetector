import os
import tarfile

def decompress_packages(dataset_dir_path: str, output_dir: str , min_size_kb: int, max_size_kb: int):
    """
    Decompresses tar.gz or tgz files found within the specified directory into an output directory,
    only if they are within the specified size range.

    Args:
    dataset_dir_path (str): Path to the directory containing the tar.gz or tgz files.
    output_dir (str): Path to the directory where the decompressed content will be stored.
    min_size_kb (int, optional): Minimum size of the files to be decompressed, in kilobytes.
    max_size_kb (int, optional): Maximum size of the files to be decompressed, in kilobytes.

    """
    decompressed_path = os.path.abspath(output_dir)
    os.makedirs(decompressed_path, exist_ok=True)

    for file_name in os.listdir(dataset_dir_path):
        if file_name.endswith('.tar.gz') or file_name.endswith('.tgz'):
            file_path = os.path.join(dataset_dir_path, file_name)
            file_size_kb = os.path.getsize(file_path) // 1024  # Convert size from bytes to kilobytes

            # Check if the file size is within the specified range
            if ((min_size_kb is None or file_size_kb >= min_size_kb) and 
                (max_size_kb is None or file_size_kb <= max_size_kb)):
                try:
                    with tarfile.open(file_path, 'r:*') as tar:
                        tar.extractall(path=decompressed_path)
                    print(f'Successfully decompressed {file_name}')
                except Exception as e:
                    print(f'Error decompressing {file_name}: {e}')
