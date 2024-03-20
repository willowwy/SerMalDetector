import os
import shutil
import argparse
import traceback
import json
import tarfile

from conf import SETTINGS

def load_settings():
    """Load settings.

    Returns:
        Settings.
    """
    settings_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'conf/settings.json')
    try:
        with open(settings_file_path, 'r') as f:
            current_settings = json.load(f)
    except FileNotFoundError:
        print(f'Error: {settings_file_path} not found!')
        exit(1)
    except json.decoder.JSONDecodeError:
        print(f'Error: {settings_file_path} is not a valid json file!')
        exit(1)
    return current_settings

def add_mode(dir: str):
    """
    Check if the folder has read, write and execute permissions, if not, add them.
    Check if the file has read and write permissions, if not, add them.

    Args:
        dir: Folder path.
    """
    if not os.path.exists(dir):
        return
    for dirpath, dirnames, filenames in os.walk(dir):
        for dirname in dirnames:
            dir_path = os.path.join(dirpath, dirname)
            if not os.access(dir_path, os.R_OK | os.W_OK | os.X_OK):
                os.chmod(dir_path, 0o777)
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            if not os.access(file_path, os.R_OK | os.W_OK):
                os.chmod(file_path, 0o666)

def decompress_packages(dataset_path: str, use_cache: bool = False) -> str:
    """Decompress packages.
    
    Args:
        dataset_path: Path of dataset.
        use_cache: Use cache or not.

    Returns:
        Path of decompressed dataset.
    """
    temp_base_path = os.path.abspath(f'.decompressed-packages')
    temp_dataset_path = os.path.abspath(os.path.join(temp_base_path, os.path.basename(dataset_path)))

    if use_cache and os.path.exists(temp_dataset_path):
        return temp_dataset_path
    if os.path.exists(temp_dataset_path):
        try:
            shutil.rmtree(temp_dataset_path)
        except PermissionError:
            print(f'Error: Delete temp dataset folder {temp_dataset_path} failed.')
            traceback.print_exc()
            add_mode(temp_dataset_path)
            shutil.rmtree(temp_dataset_path)
    os.makedirs(temp_dataset_path)
    dataset_names = os.listdir(dataset_path)
    for counter, file_name in enumerate(dataset_names):
        print(f'{counter + 1}/{len(dataset_names)}: Decompressing {file_name}...')
        file_path = os.path.join(dataset_path, file_name)
        try:
            # decompress .tar.gz file
            if file_name.endswith('.tar.gz'):
                tar = tarfile.open(file_path)
                temp_package_path = f'{temp_dataset_path}/{file_name[:-7]}'
                os.makedirs(temp_package_path, exist_ok=True)
                tar.extractall(path=temp_package_path)
                tar.close()
            # decompress .tgz file
            elif file_name.endswith('.tgz'):
                tar = tarfile.open(file_path)
                temp_package_path = f'{temp_dataset_path}/{file_name[:-4]}'
                os.makedirs(temp_package_path, exist_ok=True)
                tar.extractall(path=temp_package_path)
                tar.close()
        except Exception:
            print(f'Error: Decompress the package {file_name} failed.')
            traceback.print_exc()
    add_mode(temp_dataset_path)
    return temp_dataset_path

def extract_cli():
    """Extract features from given dataset."""
    dataset_names = args.dataset
    use_cache = args.cache
    for dataset_name in dataset_names:
        dataset_path = os.path.join(SETTINGS['path']['datasets'], dataset_name)
        dataset_path = os.path.abspath(decompress_packages(dataset_path, use_cache))
        if not os.path.exists(dataset_path):
            print(f'Error: Dataset path {dataset_path} not found!')
            exit(1)
        feature_path = os.path.abspath(os.path.join(SETTINGS['path']['features'], dataset_name))
        feature_position_path = os.path.abspath(os.path.join(SETTINGS['path']['feature-positions'], dataset_name))

        if os.path.exists(feature_path):
            try:
                shutil.rmtree(feature_path)
            except PermissionError:
                print(f'Error: Delete feature folder {feature_path} failed.')
                traceback.print_exc()
        os.makedirs(feature_path)

        if os.path.exists(feature_position_path):
            try:
                shutil.rmtree(feature_position_path)
            except PermissionError:
                print(f'Error: Delete feature position folder {feature_path} failed.')
                traceback.print_exc()
        os.makedirs(feature_position_path)

        try:
            cwd = os.getcwd()
            os.chdir('feature-extract')
            os.system(f'npm run start -- -d {dataset_path} {feature_path} {feature_position_path}')
            os.chdir(cwd)
        except Exception:
            print(f'Error: Extract feature of dataset {dataset_name} failed.')
            traceback.print_exc()



if __name__ == '__main__':
    settings = load_settings()
    DATASET_NAMES = [f for f in os.listdir(settings['path']['datasets']) if os.path.isdir(os.path.join(settings['path']['datasets'], f))]
    FEATURE_NAMES = [f for f in os.listdir(settings['path']['features']) if os.path.isdir(os.path.join(settings['path']['features'], f))]
    MODEL_NAMES = settings['classifier']['models']
    PREPROCESS_METHOD_NAMES = settings['classifier']['preprocess_methods']

    hyperparameters = {}
    parser = argparse.ArgumentParser(description='Extract, train, and predict packages.')
    subparsers = parser.add_subparsers(help='sub-command help', dest='subparser_name')

    # extract CLI parameters
    parser_extract = subparsers.add_parser('extract', help='extract features', description='Extract features from given dataset.')
    parser_extract.add_argument('-d', '--dataset', type=str, required=True, help='dataset name', choices=DATASET_NAMES, nargs='+')
    parser_extract.add_argument('-c', '--cache', type=bool, help='use cache or not', default=False)

    args = parser.parse_args()

    subparser_name = args.subparser_name
    if subparser_name == 'extract':
        extract_cli()
    else:
        print('Error: Please specify package path or model name!')
        exit(1)