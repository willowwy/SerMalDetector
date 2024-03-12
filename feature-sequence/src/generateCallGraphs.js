// generateCallGraphs.js
// const { exec } = require('child_process');
const path = require("path");
const JCG = require("@persper/js-callgraph");

/**
 * Generates a call graph for a single subdirectory.
 * @param {string} subdirPath - Path to the subdirectory for which to generate the call graph.
 */
async function CallGraphForSubdirectory(subdirPath,graphFilePath) {
  const dirName = path.basename(subdirPath);
  // const outputPath = graphFilePath;

  // Configure js-callgraph parameters
  args = {
    "cg": true,
    "output": graphFilePath, // Directly specify the output file
  };
  JCG.setArgs(args); 
  JCG.setFiles([subdirPath]); // Ensure this is `subdirPath` and not `directoryPath`
  // JCG.setFilter(['-test[^\.]*.js', '+test576.js']); // Set the filter as needed
  JCG.setConsoleOutput(false);

  try {
    const CallGraph = await JCG.build(); // Assuming `build` is async and directly writes to the file, no return value needed
    console.log(`Call Graph has been written to the file:${graphFilePath}`);
    return CallGraph; // Indicate success
  } catch (error) {
    console.error(`Error generating call graph for ${dirName}:`, error);
    return false; // Indicate failure
  }
}

module.exports = CallGraphForSubdirectory;
