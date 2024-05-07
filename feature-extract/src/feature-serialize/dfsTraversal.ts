import * as fs from 'fs/promises';
import { dfsDepthLimit } from '../index';

export interface CallQueueMap {
  [fileName: string]: string[]; // Maps file name to a list of function call indices
}

/**
 * Performs a Depth-First Search (DFS) traversal on a given call graph
 * to identify the order of function calls starting from specified entry points,
 * limiting the traversal depth to 3.
 * 
 * @param nodeIndex Index of the current node being visited.
 * @param graphData Data representing the call graph.
 * @param callQueueMap Map storing the sequence of function calls for each file.
 * @param currentPath The current path of node indices visited during the traversal.
 * @param fileName The name of the file being processed.
 */
//……
function dfsTraversal(nodeIndex: number, CallGraphFun2Fun: [number, number][], callQueueMap: CallQueueMap, currentPath: number[], fileName: string): void {
  // Halt recursion if the depth reaches global limit or detects a cycle (depth of 3 for cycles)
  if (currentPath.length > dfsDepthLimit || (currentPath.includes(nodeIndex) && currentPath.length - currentPath.indexOf(nodeIndex) > 3)) {
    return;
  }

  callQueueMap[fileName] = callQueueMap[fileName] || [];
  currentPath.push(nodeIndex);
  callQueueMap[fileName].push(nodeIndex.toString());

  // Iterate over function relationships
  CallGraphFun2Fun.forEach(([caller, callee]) => {
    if (caller === nodeIndex) {
      dfsTraversal(callee, CallGraphFun2Fun, callQueueMap, [...currentPath], fileName);
    }
  });

  currentPath.pop();
}


/**
 * Initiates the traversal of the function call graph and writes the call queue
 * to the specified output file. This function serves as the entry point for
 * performing the DFS traversal on the provided call graph.
 * 
 * @param graphFilePath Path to the graph data file.
 * @param outputPath Path where the output file will be written.
 */
export async function initiateTraversal(graphDataFilePath: string): Promise<CallQueueMap> {
  const callQueueMap: CallQueueMap = {};
  // Read the call graph data from the specified file
  let CallGraphEntries: string[] = []
  let CallGraphFiles: string[] = []
  let CallGraphFunctions: { [key: string]: string } = {}
  let CallGraphFun2Fun: [number, number][] = []


  async function readTargetData(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const json = JSON.parse(data);

      if (json.files) {
        CallGraphFiles = json.files;
      }
      if (json.functions) {
        CallGraphFunctions = json.functions;
      }
      if (json.fun2fun) {
        CallGraphFun2Fun = json.fun2fun;
      }
      if (json.entries) {
        CallGraphEntries = json.entries;
      }
      return
    } catch (error) {
      console.error('Error while reading the JSON file:', error);
    }
  }

  await readTargetData(graphDataFilePath)
  // Start DFS traversal from each entry point
  CallGraphEntries.forEach(entry => {
    const startNodeIndex = CallGraphFiles.indexOf(entry);
    if (startNodeIndex !== -1) {
      Object.keys(CallGraphFunctions).reverse().forEach(func => {
        if (CallGraphFunctions[func].startsWith(startNodeIndex.toString())) {
          dfsTraversal(parseInt(func), CallGraphFun2Fun, callQueueMap, [], entry);
        }
      });
    }
  });

  return callQueueMap;
}
