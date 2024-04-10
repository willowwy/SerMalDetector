import * as fs from 'fs/promises';
import {CallGraph} from '../call-graph/generateCallGraph';
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
function dfsTraversal(nodeIndex: number, graphData: CallGraph, callQueueMap: CallQueueMap, currentPath: number[], fileName: string): void {
  // Halt recursion if the depth reaches global limit or detects a cycle (depth of 3 for cycles)
  if (currentPath.length > dfsDepthLimit || (currentPath.includes(nodeIndex) && currentPath.length - currentPath.indexOf(nodeIndex) > 3)) {
    return;
  }

  callQueueMap[fileName] = callQueueMap[fileName] || [];
  currentPath.push(nodeIndex);
  callQueueMap[fileName].push(nodeIndex.toString());

  // Iterate over function relationships
  graphData.fun2fun.forEach(([caller, callee]) => {
    if (caller === nodeIndex) {
      dfsTraversal(callee, graphData, callQueueMap, [...currentPath], fileName);
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
export async function initiateTraversal(graphData: any): Promise<CallQueueMap> {
  const callQueueMap: CallQueueMap = {};

  // Start DFS traversal from each entry point
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

  return callQueueMap;
}
