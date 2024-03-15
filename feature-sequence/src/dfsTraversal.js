const fs = require("fs").promises; // 使用fs的promise API以支持异步操作
const path = require("path");

/**
 * Performs a Depth-First Search (DFS) traversal on a given call graph to identify
 * the order of function calls starting from specified entry points.
 * 
 * @param {number} nodeIndex Index of the current node being visited.
 * @param {Object} graphData Data representing the call graph.
 * @param {Object} callQueueMap Map storing the sequence of function calls for each file.
 * @param {Array} currentPath The current path of node indices visited during the traversal.
 * @param {string} fileName The name of the file being processed.
 */
function dfsTraversal(nodeIndex, graphData, callQueueMap, currentPath, fileName) {
  if (!callQueueMap[fileName]) {
    callQueueMap[fileName] = [];
  }

  currentPath.push(nodeIndex);

  const isRecursiveCall = currentPath.slice(-4).every(index => index === nodeIndex);
  
  if (!isRecursiveCall || currentPath.length < 4) {
    callQueueMap[fileName].push(nodeIndex.toString());

    graphData.fun2fun.forEach(([caller, callee]) => {
      if (caller === nodeIndex) {
        dfsTraversal(callee, graphData, callQueueMap, [...currentPath], fileName);
      }
    });
  }

  currentPath.pop();
}

/**
 * Initiates the traversal of the function call graph and writes the call queue
 * to the specified output file.
 * 
 * @param {string} graphFilePath Path to the graph data file.
 * @param {string} outputPath Path where the output file will be written.
 */
async function initiateTraversal(graphFilePath, outputPath) {
  const graphData = JSON.parse(await fs.readFile(graphFilePath, 'utf-8'));
  const callQueueMap = {};

  graphData.entries.forEach(entry => {
    const startNodeIndex = graphData.files.indexOf(entry);
    if (startNodeIndex !== -1) {
      Object.keys(graphData.functions).forEach(func => {
        if (graphData.functions[func].startsWith(startNodeIndex.toString())) {
          dfsTraversal(parseInt(func), graphData, callQueueMap, [], entry);
        }
      });
    }
  });

  await fs.writeFile(outputPath, JSON.stringify(callQueueMap, null, 2), "utf8");
  console.log(`Function call queue has been written to the file: ${outputPath}`);
}

module.exports = { initiateTraversal };
