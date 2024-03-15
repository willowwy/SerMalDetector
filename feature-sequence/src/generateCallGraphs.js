// generateCallGraphs.js
const { exec } = require('child_process');
const path = require('path');

/**
 * Generates a call graph for a single subdirectory.
 * @param {string} subdirPath - Path to the subdirectory for which to generate the call graph.
 */
async function CallGraphForSubdirectory(subdirPath,CallGraphFilePath) {
    return new Promise((resolve, reject) => {
        const dirName = path.basename(subdirPath);
        const PackagePath = path.join(subdirPath, "package");

        const command = `npx jelly -j ${CallGraphFilePath} ${PackagePath}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error for ${dirName}:`, error);
                reject(error);
                return;
            }
            if (stdout) console.log(`Standard output for ${dirName}:`, stdout);
            if (stderr) console.error(`Standard error for ${dirName}:`, stderr);
            
            console.log(`Call graph generated for: ${dirName}`);
            resolve();
        });
    });
}

module.exports = CallGraphForSubdirectory;
