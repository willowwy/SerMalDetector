import os
import tarfile
import shutil

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
                    # print(f'Successfully decompressed {file_name}')
                except Exception as e:
                    print(f'Error decompressing {file_name}: {e}')

def copy_packages(dataset_dir_path: str, output_dir: str, min_size_kb: int, max_size_kb: int):
    """
    Copies tar.gz or tgz files found within the specified directory into an output directory,
    only if they are within the specified size range.

    Args:
    dataset_dir_path (str): Path to the directory containing the tar.gz or tgz files.
    output_dir (str): Path to the directory where the files will be copied.
    min_size_kb (int): Minimum size of the files to be copied, in kilobytes.
    max_size_kb (int): Maximum size of the files to be copied, in kilobytes.
    """
    destination_path = os.path.abspath(output_dir)
    os.makedirs(destination_path, exist_ok=True)

    for file_name in os.listdir(dataset_dir_path):
        if file_name.endswith('.tar.gz') or file_name.endswith('.tgz'):
            file_path = os.path.join(dataset_dir_path, file_name)
            file_size_kb = os.path.getsize(file_path) // 1024  # Convert size from bytes to kilobytes

            # Check if the file size is within the specified range
            if ((min_size_kb is None or file_size_kb >= min_size_kb) and 
                (max_size_kb is None or file_size_kb <= max_size_kb)):
                try:
                    shutil.copy2(file_path, destination_path)
                    # print(f'Successfully copied {file_name}')
                except Exception as e:
                    print(f'Error copying {file_name}: {e}')
                    
def mv_packages(dataset_dir_path: str, output_dir: str, min_size_kb: int, max_size_kb: int):
    """
    Moves tar.gz or tgz files found within the specified directory into an output directory,
    only if they are within the specified size range.

    Args:
    dataset_dir_path (str): Path to the directory containing the tar.gz or tgz files.
    output_dir (str): Path to the directory where the files will be moved.
    min_size_kb (int): Minimum size of the files to be moved, in kilobytes.
    max_size_kb (int): Maximum size of the files to be moved, in kilobytes.
    """
    destination_path = os.path.abspath(output_dir)
    os.makedirs(destination_path, exist_ok=True)

    for file_name in os.listdir(dataset_dir_path):
        if file_name.endswith('.tar.gz') or file_name.endswith('.tgz'):
            file_path = os.path.join(dataset_dir_path, file_name)
            file_size_kb = os.path.getsize(file_path) // 1024  # Convert size from bytes to kilobytes

            # Check if the file size is within the specified range
            if ((min_size_kb is None or file_size_kb >= min_size_kb) and 
                (max_size_kb is None or file_size_kb <= max_size_kb)):
                try:
                    shutil.move(file_path, destination_path)
                    # print(f'Successfully moved {file_name}')
                except Exception as e:
                    print(f'Error moving {file_name}: {e}')

def compress_and_move_folders(dataset_dir_path: str, output_dir: str, min_size_kb: int, max_size_kb: int):
    """
    Compresses folders found within the specified directory into tar.gz files and moves them
    to an output directory, only if they are within the specified size range.

    Args:
    dataset_dir_path (str): Path to the directory containing the folders.
    output_dir (str): Path to the directory where the compressed files will be moved.
    min_size_kb (int): Minimum size of the folders to be compressed, in kilobytes.
    max_size_kb (int): Maximum size of the folders to be compressed, in kilobytes.
    """
    destination_path = os.path.abspath(output_dir)
    os.makedirs(destination_path, exist_ok=True)

    for folder_name in os.listdir(dataset_dir_path):
        folder_path = os.path.join(dataset_dir_path, folder_name)
        if os.path.isdir(folder_path):
            folder_size_kb = sum(os.path.getsize(os.path.join(dirpath, filename)) 
                                 for dirpath, _, filenames in os.walk(folder_path) 
                                 for filename in filenames) // 1024  # Convert size from bytes to kilobytes

            # Check if the folder size is within the specified range
            if ((min_size_kb is None or folder_size_kb >= min_size_kb) and 
                (max_size_kb is None or folder_size_kb <= max_size_kb)):
                tar_file_path = os.path.join(dataset_dir_path, f"{folder_name}.tar.gz")
                try:
                    # Compress the folder
                    with tarfile.open(tar_file_path, "w:gz") as tar:
                        tar.add(folder_path, arcname=os.path.basename(folder_path))
                    
                    # Move the compressed file to the destination directory
                    shutil.move(tar_file_path, destination_path)
                    # print(f'Successfully compressed and moved {folder_name}')
                except Exception as e:
                    print(f'Error compressing and moving {folder_name}: {e}')