import os
from decompress import *

def ensure_directory_exists(directory):
    """Ensure the specified directory exists; create it if it does not."""
    os.makedirs(directory, exist_ok=True)
    
    
# Path to the directory containing the malicious compressed packages
data_dir = '/home/wwy/datasets/BenPac/longBenSrc'
# Path to the directory containing short malicious scource files
output_dir = '/home/wwy/detect-malicious-npm-package-with-machine-learning/datasets/preprocessed-datasets/benign'

# constraints of packages' size
MIN_SIEZ_KB = 200
MAX_SIZE_KB = None

# Create new directory (if not exsit)
ensure_directory_exists(data_dir)
ensure_directory_exists(output_dir)

# decompress_packages(data_dir, output_dir, min_size_kb=MIN_SIEZ_KB, max_size_kb=MAX_SIZE_KB)
# copy_packages(data_dir, output_dir, min_size_kb=MIN_SIEZ_KB, max_size_kb=MAX_SIZE_KB)
# mv_packages(data_dir, output_dir, min_size_kb=MIN_SIEZ_KB, max_size_kb=MAX_SIZE_KB)
compress_and_move_folders(data_dir, output_dir, min_size_kb=MIN_SIEZ_KB, max_size_kb=MAX_SIZE_KB)

print(f'Extracting long benign code complete to {output_dir}')