#!/bin/bash

# echo 'Setuping the python environment and dependencies...'
# python3 -m venv env && \
# source env/bin/activate && \
# pip3 install -r training/requirements.txt
# deactivate
# echo 'Setuping the python environment and dependencies done!'
# Create data directories

echo 'Creating data directories...'
mkdir data
mkdir -p data/call-graphs data/datasets data/feature-positions data/features
echo 'Data directories created!'

echo 'Setuping the node environment and dependencies...'
cd feature-extract && \
npm install && \
npm run compile && \
cd ../feature-sequence&& \
npm install && \
echo 'Setuping the node environment and dependencies done!'
