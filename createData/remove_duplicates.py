import os
import hashlib
from collections import defaultdict

def get_file_hash(file_path):
    """Compute the MD5 hash of the file."""
    hasher = hashlib.md5()
    with open(file_path, 'rb') as file:
        buffer = file.read()
        hasher.update(buffer)
    return hasher.hexdigest()

def remove_duplicate_files(directory):
    """Remove duplicate files in the given directory."""
    files_by_hash = defaultdict(list)
    removed_count = 0

    # Populate the dictionary with file hashes and their paths
    for root, _, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            file_hash = get_file_hash(file_path)
            files_by_hash[file_hash].append(file_path)

    # Count the total number of files before deduplication
    total_files_before = sum(len(file_paths) for file_paths in files_by_hash.values())

    # Remove duplicates
    for file_paths in files_by_hash.values():
        if len(file_paths) > 1:
            # Keep the first file and remove the rest
            for file_path in file_paths[1:]:
                os.remove(file_path)
                removed_count += 1
                print(f"Removed duplicate file: {file_path}")

    # Count the total number of files after deduplication
    total_files_after = total_files_before - removed_count

    print(f"Total files before deduplication: {total_files_before}")
    print(f"Total duplicates removed: {removed_count}")
    print(f"Total files after deduplication: {total_files_after}")

if __name__ == "__main__":
    directory = "/home/wwy/SerMalDetector/datasets/MalinBenPac/features"
    if os.path.isdir(directory):
        remove_duplicate_files(directory)
    else:
        print("Invalid directory path.")
