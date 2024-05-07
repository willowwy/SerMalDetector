def extract_errors(input_filepath, output_filepath):
    try:
        with open(input_filepath, 'r') as file:
            # 读取所有行，并筛选包含'error'的行
            errors = [line for line in file if 'error' in line.lower()]

        # 将筛选出的错误信息写入到输出文件
        with open(output_filepath, 'w') as file:
            file.writelines(errors)
        
        print(f"Error messages have been extracted to {output_filepath}.")

    except FileNotFoundError:
        print(f"File not found: {input_filepath}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

# 调用函数，指定输入日志文件和输出日志文件
extract_errors('call-graph.log', 'error.log')
