import os
import random
import shutil

def remove_random_directories(directory, target_count):
    """Remove random subdirectories until the total count is equal to the target count."""
    # Get a list of all subdirectories
    all_subdirs = [os.path.join(directory, d) for d in os.listdir(directory) if os.path.isdir(os.path.join(directory, d))]
    
    total_subdirs = len(all_subdirs)
    if total_subdirs <= target_count:
        print(f"Already have {total_subdirs} or fewer directories. No need to remove any.")
        return
    
    # Shuffle the list to ensure randomness
    random.shuffle(all_subdirs)
    
    # Calculate the number of directories to remove
    dirs_to_remove = total_subdirs - target_count
    
    # Remove the directories
    for subdir in all_subdirs[:dirs_to_remove]:
        shutil.rmtree(subdir)
        print(f"Removed directory: {subdir}")
    
    print(f"Total directories before removal: {total_subdirs}")
    print(f"Total directories removed: {dirs_to_remove}")
    print(f"Total directories after removal: {total_subdirs - dirs_to_remove}")

if __name__ == "__main__":
    datasets_dir = '/home/wwy/SerMalDetector/datasets/MalinBenPac/longBenSrc'
    target_count = 1000
    
    if os.path.isdir(datasets_dir):
        remove_random_directories(datasets_dir, target_count)
    else:
        print("Invalid directory path.")
