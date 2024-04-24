import os
import re
import json
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from decompress import decompress_packages

def ensure_directory_exists(directory):
    """Ensure the specified directory exists; create it if it does not."""
    os.makedirs(directory, exist_ok=True)

def process_js_files_in_directory(dirname, data_dir, output_dir):
    """Process JavaScript files in a given directory based on node-related scripts."""
    dirpath = os.path.join(data_dir, dirname)
    if os.path.isdir(dirpath):
        package_json_path = os.path.join(dirpath, 'package', 'package.json')
        try:
            with open(package_json_path, 'r') as file:
                package_json = json.load(file)
                scripts = package_json.get('scripts', {})
                for script, command in scripts.items():
                    if 'node' in command and 'install' in script:
                        js_files = re.findall(r'node\s+(?:[\w-]+\s+)*([\w./-]+\.js)', command)
                        for js_file in js_files:
                            js_file_path = os.path.join(dirpath, 'package', js_file)
                            try:
                                with open(js_file_path, 'r') as js_file_content:
                                    content = js_file_content.read()
                                new_js_file_path = os.path.join(output_dir, f"{dirname}.js")
                                with open(new_js_file_path, 'w') as new_file:
                                    new_file.write(content)
                                # print(f"Processed {js_file_path} into {new_js_file_path}")
                            except Exception as e:
                                print(f"Error processing {js_file_path}: {e}")
        except Exception as e:
            print(f'Error reading {package_json_path}: {e}')

def extract_and_process_js_files(data_dir, output_dir):
    """Traverse the directory to find package.json, extract JavaScript file paths directly from node-related scripts,
    and copy them to the output directory using multiple threads."""
    directories = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
    with ThreadPoolExecutor(max_workers=4) as executor:  # Adjust number of workers as needed
        future_to_dir = {executor.submit(process_js_files_in_directory, d, data_dir, output_dir): d for d in directories}
        for future in as_completed(future_to_dir):
            dir = future_to_dir[future]
            try:
                future.result()
            except Exception as e:
                print(f"Exception occurred processing directory {dir}: {e}")


# Path to the directory containing the malicious compressed packages
data_dir = '/home/wwy/SerMalDetector/MalnpmDB/MalnpmDB/mal'
# Path to the directory where the decompressed content will be stored
cache_dir = '/home/wwy/SerMalDetector/createDatasets/MalinBenPac/.cache'
# Path to the directory containing short malicious scource files
output_dir = '/home/wwy/SerMalDetector/createDatasets/MalinBenPac/shortMalSrc'



# constraints of packages' size
MIN_SIEZ_KB = 1
MAX_SIZE_KB = 2

# Clear cache directory
shutil.rmtree(cache_dir, ignore_errors=True)
# Create new directory (if not exsit)
ensure_directory_exists(cache_dir)
ensure_directory_exists(data_dir)
ensure_directory_exists(output_dir)

decompress_packages(data_dir, cache_dir, min_size_kb=MIN_SIEZ_KB, max_size_kb=MAX_SIZE_KB)
extract_and_process_js_files(cache_dir, output_dir)

print(f'Extracting short malicious code complete to {output_dir}')
