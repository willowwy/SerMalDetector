# SerMalDetector

## Introduction

A project aimed at detecting and analyzing malicious package patterns through the use of sophisticated feature extraction and sequence analysis techniques.

## Requirements

### Environment

- Python: Python 3.11.1
- node.js: node.js v20.0.0

### Installation
Use the following command to setup the project. It will install all the required dependencies and create the necessary directories.
```sh
$ ./setup.sh
```

## Usage
### Extract Features
This module is used to generate serialized feature sequences. To better match the execution order of real npm packages, there are multiple entry points. The module traverses and checks all `ts` and `js` files of the entire package according to the order of the function call graph.

To extract features from a package, use the following command:
```sh
$ python extract.py [--gz]
```
If all datasets in the target dataset are compressed packages ending with .tgz or .tar.gz, then you need to add the --gz parameter.

The paramaters in `extract.py` are the path to the package you want to analyze, some path to save the temp files, and results to storage results, which are listed below:

|Options|Description|
|---|---|
| dataset_dir_path | Dataset that needs to be decompressed |
| call_graph_dir_path | Directory to to store the call graphs |
| feature_pos_dir_path | Directory to to store the features' positions |
| sequential_feature_dir_path | Directory to to store the extracted sequential features |
| cache_dir | Directory to to store the cache files if the datasets are compressed packages ending with `.tgz` or `.tar.gz`.


### Augment Datasets
This script is used to augment the dataset by inserting malicious packages to benign packages. The script will create a new dataset with the same number of benign packages and malicious packages. 
1. extract the long and complex benign packages from the npm repository.
    ```sh
    $ python3 ExtractLongBen.py
    ```
    - data_dir : Directory to store the original benign dataset
    - output_dir : Directory to store the extracted benign packages
    - MIN_SIEZ_KB : Minimum size of the benign package in KB
    - MAX_SIZE_KB : Maximum size of the benign package in KB

2. extract the short malicious packages from the npm repository.
    ```sh
    $ python3 ExtractShortMal.py
    ```
    - data_dir : Directory to store the original malicous dataset
    - output_dir : Directory to store the extracted malicious packages
    - MIN_SIEZ_KB : Minimum size of the malicious package in KB
    - MAX_SIZE_KB : Maximum size of the malicious package in KB

3. insert the malicious packages to the benign packages.
    ```sh
    $ python3 InsertMalToBen.py
    ```
    - NUM_INSERTIONS : The number of insertions to perform for each subfolder in LongBenPac
    - RESULT_MULTIPLIER : The number of result folders to create for each subfolder in LongBenPac
    - MAX_POINTS : The maximum number of possible insert points to consider in each file
    - RESULT_PATH : The path to the directory where the results will be stored
    - process_folders : Directory of short malicious packages to be processed and directory of long benign packages.
    
    eg: If `NUM_INSERTIONS` is 2 and `RESULT_MULTIPLIER` is 3, it means inserting two malicious snippets into a benign package and repeating this process three times. This means that a single benign package consumes six short malicious snippets, resulting in three new long malicious packages.


## Project Structure
```
SerMalDetector
|
├─ data
│  ├─ call-graphs(call graphs of analyzed packages)  
│  ├─ datasets(used datasets)
│  ├─ feature-positions(feature positions of analyzed packages)
│  └─ features(features of analyzed packages)
|
├─ feature-extract(used to extract features from packages)
│  ├─ material
│  │  └─ top-domains.json
│  └─ src
│     ├─ config.ts
│     ├─ feature-extract
│     ├─ programs
│     │  └─ AnalyzePackage
│     │     └─ PackageAnalyzer.ts
│     └─ util
│        ├─ FileUtil.ts
│        └─ index.ts
|
├─ creat-data(used to create long and complex npm packages)
│  ├─ ExtractLongBen.py
│  ├─ ExtractShortMal.py
│  ├─ InsertMalToBen.py
│  └─ InsertMalToBen.py
|
├─ training(used to train the model)
│  ├─ lstmTrain.py
│  └─ wordVectorTrain.py
└─ ...

```
