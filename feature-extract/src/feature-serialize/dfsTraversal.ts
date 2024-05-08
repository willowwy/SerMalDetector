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
 * @param CallGraphFun2Fun Data representing the call graph.
 * @param callQueueMap Map storing the sequence of function calls for each file.
 * @param currentPath The current path of node indices visited during the traversal.
 * @param fileName The name of the file being processed.
 */
function dfsTraversal(nodeIndex: number, CallGraphFun2Fun: [number, number][], callQueueMap: CallQueueMap, currentPath: number[], fileName: string): void {
  if (currentPath.length > dfsDepthLimit || (currentPath.includes(nodeIndex) && currentPath.length - currentPath.indexOf(nodeIndex) > 3)) {
    return;
  }

  callQueueMap[fileName] ||= [];
  currentPath.push(nodeIndex);
  callQueueMap[fileName].push(nodeIndex.toString());

  CallGraphFun2Fun.forEach(([caller, callee]) => {
    if (caller === nodeIndex) {
      dfsTraversal(callee, CallGraphFun2Fun, callQueueMap, [...currentPath], fileName);
    }
  });

  currentPath.pop();
}

/**
 * Reads the call graph data from the specified file and initializes DFS traversal from each entry point.
 * 
 * @param graphFilePath Path to the graph data file.
 * @param ifCallGraphGenerated Indicates whether the call graph was generated (-1 for not generated).
 * @returns A promise that resolves with the call queue map.
 */
export async function initiateTraversal(graphDataFilePath: string, ifCallGraphGenerated: number): Promise<CallQueueMap> {
  const callQueueMap: CallQueueMap = {};

  if (ifCallGraphGenerated === -1) {
    try {
      const data = await fs.readFile(graphDataFilePath, 'utf8');
      const json = JSON.parse(data);
      const CallGraphFiles: string[] = json.files || [];

      CallGraphFiles.forEach(file => {
        callQueueMap[file] = ['global'];
      });
    } catch (error) {
      console.error('Error while reading the JSON file:', error);
    }

    return callQueueMap;
  }

  try {
    const data = await fs.readFile(graphDataFilePath, 'utf8');
    const { files: CallGraphFiles = [], functions: CallGraphFunctions = {}, fun2fun: CallGraphFun2Fun = [], entries: CallGraphEntries = [] } = JSON.parse(data);

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
  } catch (error) {
    console.error('Error while reading the JSON file:', error);
  }

  return callQueueMap;
}