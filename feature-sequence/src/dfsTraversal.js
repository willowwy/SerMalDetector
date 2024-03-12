const fs = require("fs");
const path = require("path");

/**
 * Finds the start node based on the main entry point specified in package.json.
 * @param {string} dirPath The path to the directory containing package.json.
 * @param {string} graphData The graph data file.
 * @returns {Object} The start node if found, otherwise null.
 */
function findStartNode(dirPath, graphData) {
  try {
    const packageJSONPath = path.join(dirPath, 'package', 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packageJSONPath, 'utf-8'));
    if (!packageContent || !packageContent.main) {
      throw new Error('Invalid package.json or main entry point not specified.');
    }

    const entryPointPath = path.normalize(packageContent.main);
    const startNode = graphData.find(node => node.source.file.endsWith(entryPointPath));
    if (startNode === undefined) {
      console.log(path.basename(dirPath) + ': startNode does not exist');
      return null;
    }
    return startNode;
  } catch (error) {
    console.error('Error finding start node:', error.message);
    return null;
  }
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

  graphData.forEach((node) => {
    if (
      node.source.label === currentNode.target.label &&
      !visited.has(node.target.label)
    ) {
      dfsTraversal(node, graphData, visited, callQueue);
    }
  });
}

/**
 * Initiates DFS traversal and saves the traversal queue to a file.
 * @param {string} graphFilePath - Path to the call graph JSON file. 
 * @param {string} DirPath - Dir name for the traversal. 
 * @param {string} outputPath - Path to save the traversal queue. 
 */
function initiateTraversal(graphFilePath, DirPath, outputPath, graphData) {
  const visited = new Set();
  const callQueue = [];

  if (startNode = findStartNode(DirPath, graphData)) {
    dfsTraversal(startNode, graphData, visited, callQueue);
    fs.writeFileSync(outputPath, callQueue.join("\n"), "utf8");
    console.log(
      `Function call queue has been written to the file: ${outputPath}`
    );
  }
  else {
    fs.writeFile(outputPath, '', (err) => {
      if (err) throw err;
      console.log('Empty file created successfully.');
    });
  }
}

/**
 * The main function orchestrating the program execution.
 */
module.exports = { initiateTraversal };
