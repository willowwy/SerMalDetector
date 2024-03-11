const fs = require('fs');
const path = require('path');

// Define paths to the package.json, call graph files, and the output file.
const PATH_PACKAGE_JSON = './package/package.json';
const PATH_CALL_GRAPH = './call.json';
const PATH_OUTPUT = './callQueue.txt';

/**
 * Reads and parses a JSON file.
 * @param {string} filePath The path to the JSON file.
 * @returns {Object} Parsed JSON object.
 */
function readJSONFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

/**
 * Performs a DFS traversal from the specified node, marking visited nodes and compiling a call queue.
 * @param {Object} currentNode The node from which to start traversal.
 * @param {Array} graphData Data representing the call graph.
 * @param {Set} visited A set to track visited nodes.
 * @param {Array} callQueue An array to compile the traversal order.
 */
function dfsTraversal(currentNode, graphData, visited, callQueue) {
  visited.add(currentNode.source.label);
  callQueue.push(currentNode.source.label);

  graphData.forEach(node => {
    if (node.source.label === currentNode.target.label && !visited.has(node.target.label)) {
      dfsTraversal(node, graphData, visited, callQueue);
    }
  });
}

/**
 * Identifies the start node based on the entry point specified in package.json and initiates DFS traversal.
 * @param {Array} graphData Data representing the call graph.
 * @returns {number} Status code indicating the result of the operation.
 */
function initiateTraversal(graphData) {
  const visited = new Set();
  const callQueue = [];
  const entryPointPath = path.normalize(readJSONFile(PATH_PACKAGE_JSON).main);
  const startNode = graphData.find(node => node.source.file.endsWith(entryPointPath));

  if (startNode) {
    dfsTraversal(startNode, graphData, visited, callQueue);
    fs.writeFileSync(PATH_OUTPUT, callQueue.join('\n'), 'utf8');
    console.log(`Function call queue has been written to the file: ${PATH_OUTPUT}`);
  } else {
    console.error("Entry point node not found.");
  }
}

/**
 * The main function orchestrating the program execution.
 */
function main() {
  const graphData = readJSONFile(PATH_CALL_GRAPH);
  initiateTraversal(graphData);
}

main();