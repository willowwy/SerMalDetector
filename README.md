# SerMalDetector

## Introduction

A project aimed at detecting and analyzing malicious package patterns through the use of sophisticated feature extraction and sequence analysis techniques.

## Requirements

### Environment

Python: Python 3.11.1
node.js: node.js v20.0.0

### Installation

As the project is in its initial development phase, installation instructions will be provided as soon as a stable version is available.

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
├─ feature-sequence(used to generate the sequence of features)
│  ├─ package-lock.json
│  ├─ package.json
│  └─ src
│     └─ analyze.py
├─ setup.sh
└─ tsconfig.json

```
