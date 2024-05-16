import random
import os
import shutil
import logging

# Configure the logging module
logging.basicConfig(
    level=logging.ERROR,  # 设置日志级别为ERROR，这意味着只有ERROR及以上级别的日志会被记录
    format='%(asctime)s - %(levelname)s - %(message)s',  # 设置日志格式
    filename='error.log',  # 指定日志文件名
    filemode='a'  # 设置文件模式为'a'，表示追加模式
)

def read_file(file_path):
    """Reads the content of a file."""
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()


def write_file(file_path, content):
    """Writes content to a file."""
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(content)


def get_all_js_files_in_subfolder(subfolder):
    """Gets all JavaScript files in the given subfolder."""
    js_files = []
    for root, dirs, files in os.walk(subfolder):
        js_files.extend(
            [os.path.join(root, file) for file in files if file.endswith(".js")]
        )
    return js_files


def get_possible_insert_points(file_content):
    """Determines safer possible insert points avoiding mid-structure interruptions."""
    possible_insert_points = []
    lines = file_content.split("\n")
    in_function = False

    for i, line in enumerate(lines):
        stripped_line = line.strip()
        if (
            any(
                stripped_line.startswith(x)
                for x in ["function ", "const ", "let ", "var "]
            )
            and "{" in stripped_line
        ):
            in_function = True
        if in_function and stripped_line.endswith("}"):
            in_function = False
            possible_insert_points.append(i + 1)  # End of function or control structure
            if (
                len(possible_insert_points) >= MAX_POINTS
            ):  # Assuming MAX_POINTS is defined elsewhere
                return possible_insert_points

    # Always add the end of the file as a safe insert point if the file isn't empty
    if lines:  # Check if there are any lines at all
        possible_insert_points.append(len(lines))

    return possible_insert_points


def extract_imports_and_rest(code):
    """Extracts import and require statements and the rest of the code."""
    imports, rest = [], []
    lines = code.split("\n")
    for line in lines:
        if line.strip().startswith(("import ", "require(")):
            imports.append(line)
        else:
            rest.append(line)
    return "\n".join(imports), "\n".join(rest)


def insert_code_at_random_global_position(file_a, file_b):
    code_a = read_file(file_a)
    file_content = read_file(file_b)

    imports_code, rest_code = extract_imports_and_rest(code_a)
    insert_points = get_possible_insert_points(file_content)
    insert_point = random.choice(insert_points)

    # Prepend imports at the top, and insert the rest at a random position
    file_content = (
        "\n".join([imports_code, file_content]) if imports_code else file_content
    )
    new_content = "\n".join(
        file_content.split("\n")[:insert_point]
        + [rest_code]
        + file_content.split("\n")[insert_point:]
    )

    write_file(file_b, new_content)
    print(f"Code from {file_a} inserted into {file_b} at position {insert_point}.")


def insert_a_to_b(files_a, current_subfolder_b):
    """Inserts code from files_a into files_b."""
    # mkdir result folder
    b_base_name = os.path.basename(current_subfolder_b)
    files_a_names = "_".join(os.path.basename(file_a) for file_a in files_a)
    result_folder_name = b_base_name + "_" + files_a_names
    result_path = os.path.join(RESULT_PATH, result_folder_name)
    os.makedirs(result_path, exist_ok=True)

    # Copy all files from subfolder B to the result folder
    for item in os.listdir(current_subfolder_b):
        s = os.path.join(current_subfolder_b, item)
        d = os.path.join(result_path, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)

    for file_a in files_a:
        files_b = get_all_js_files_in_subfolder(result_path)
        try:
            if not files_b:
                raise ValueError(f"No JavaScript files found in {current_subfolder_b}.")
        except ValueError as e:
            logging.error(e)
            return False  # Indicate an error occurred        
        
        target_file_b = random.choice(files_b)
        insert_code_at_random_global_position(file_a, target_file_b)
    
    return result_folder_name


def process_folders(folder_a_path, folder_b_path):
    """Processes the given folders."""
    total_packages = 0
    # Get all JavaScript files from folder A
    files_a = [file for file in os.listdir(folder_a_path) if file.endswith(".js")]
    try:
        if not files_a:
            raise ValueError(f"No subfolders found in folder shortMalSrc.")
    except ValueError as e:
        logging.error(e)
        return False  # Indicate an error occurred   
    
    # Get all first-level subfolders in folder B
    subfolders_b = [
        os.path.join(folder_b_path, folder)
        for folder in os.listdir(folder_b_path)
        if os.path.isdir(os.path.join(folder_b_path, folder))
    ]
    try:
        if not subfolders_b:
            raise ValueError(f"No subfolders found in folder LongBenPac.")
    except ValueError as e:
        logging.error(e)
        return False  # Indicate an error occurred 

    # Process the subfolders
    files_a_iterator = iter(files_a)
    for current_subfolder_b in subfolders_b:
        for _ in range(RESULT_MULTIPLIER):
            current_files_a = []
            for _ in range(NUM_INSERTIONS):
                try:
                    file_a = next(files_a_iterator)
                    file_a_path = os.path.join(folder_a_path, file_a)
                    current_files_a.append(file_a_path)
                except StopIteration:
                    # If all files have been iterated through, reset the iterator
                    files_a_iterator = iter(files_a)
                    file_a = next(files_a_iterator)
                    file_a_path = os.path.join(folder_a_path, file_a)
                    current_files_a.append(file_a_path)
            # Process the current subfolder
            result_folder_name = insert_a_to_b(current_files_a, current_subfolder_b)
            total_packages += 1
            print(f"Processed subfolder '{current_subfolder_b}' into result folder '{result_folder_name}'.")

    print(f"Total new packages generated: {total_packages}")


# The number of insertions to perform for each subfolder in LongBenPac
NUM_INSERTIONS = 2
# The number of result folders to create for each subfolder in LongBenPac
RESULT_MULTIPLIER = 2
# The maximum number of possible insert points to consider in each file
MAX_POINTS = 50
# The path to the directory where the results will be stored
RESULT_PATH = "/home/wwy/SerMalDetector/datasets/MalinBenPac/new_guifan"
process_folders(
    "/home/wwy/SerMalDetector/datasets/MalinBenPac/shortMalSrc",
    "/home/wwy/SerMalDetector/datasets/MalinBenPac/longBenSrc",
)
