import random
import os

def read_file(file_path):
    """Reads the content of a file."""
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def write_file(file_path, content):
    """Writes content to a file."""
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(content)

def get_possible_insert_points(file_content):
    """Determines possible insert points based on patterns in the file content."""
    possible_insert_points = []
    in_class = False
    in_async_function = False
    in_control_structure = False

    for i, line in enumerate(file_content.split('\n')):
        stripped_line = line.strip()
        
        if stripped_line.startswith('class '):
            in_class = True
        if in_class and stripped_line.endswith('}'):
            in_class = False
            possible_insert_points.append(i + 1)
        
        if 'async function' in stripped_line:
            in_async_function = True
        if in_async_function and stripped_line.endswith('}'):
            in_async_function = False
            possible_insert_points.append(i + 1)
        
        if '.addEventListener(' in stripped_line and stripped_line.endswith(');'):
            possible_insert_points.append(i + 1)

        if stripped_line.startswith('import '):
            possible_insert_points.append(i + 1)
        
        if any(x in stripped_line for x in ['if ', 'switch ', 'for ', 'while ']):
            in_control_structure = True
        if in_control_structure and stripped_line.endswith('}'):
            in_control_structure = False
            possible_insert_points.append(i + 1)
    
    possible_insert_points.append(len(file_content.split('\n')))
    return possible_insert_points

def insert_code_at_random_global_position(code_a, file_b_path):
    """
    Inserts code from code_a into file_b at a random global position.

    Args:
        code_a (str): Code to be inserted.
        file_b_path (str): Path to the file where the code will be inserted.
    """
    file_b_content = read_file(file_b_path)
    insert_points = get_possible_insert_points(file_b_content)
    
    if insert_points:
        insert_point = random.choice(insert_points)
        new_content = '\n'.join(file_b_content.split('\n')[:insert_point] + [''] + [code_a] + [''] + file_b_content.split('\n')[insert_point:])
    else:
        new_content = file_b_content + '\n' + code_a + '\n'
    
    write_file(file_b_path, new_content)

def process_folders(folder_a_path, folder_b_path):
    """
    Inserts code files from folder_a into corresponding code files in folder_b.

    Args:
        folder_a_path (str): Path to the folder containing code files to be inserted.
        folder_b_path (str): Path to the folder where code files will be inserted.
    """
    files_a = sorted(os.listdir(folder_a_path))
    files_b = sorted(os.listdir(folder_b_path))
    
    if len(files_a) != len(files_b):
        raise ValueError("Unequal number of files in folders A and B")
    
    for file_a, file_b in zip(files_a, files_b):
        file_a_path = os.path.join(folder_a_path, file_a)
        file_b_path = os.path.join(folder_b_path, file_b)
        
        insert_code_at_random_global_position(read_file(file_a_path), file_b_path)
        print(f"Inserted content from {file_a} into {file_b}")

process_folders('Testing/shortMal', 'Testing/longBen')
