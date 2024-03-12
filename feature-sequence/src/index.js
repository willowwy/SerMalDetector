// index.js
const fs = require("fs");
const path = require("path");
const CallGraphForSubdirectory = require("./generateCallGraphs");
const { initiateTraversal } = require("./dfsTraversal");

const DB_DIRECTORY_PATH = "../data/big";
const CG_DIRECTORY_PATH = "../data/call-graphs";
const QUEUE_DIRECTORY_PATH = "../data/func-queue";

/**
 * Traverses the root directory and generates call graphs and traversal queues for each subdirectory.
 * @param {string} rootDirectoryPath - The path to the root directory.
 */
async function traverseAndGenerate(rootDirectoryPath) {
    const directories = fs
        .readdirSync(rootDirectoryPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory());

    for (const dir of directories) {
        const subDataPath = path.join(rootDirectoryPath, dir.name);
        const graphFilePath = path.join(CG_DIRECTORY_PATH, `${dir.name}_cg.json`);
        const queueFilePath = path.join(QUEUE_DIRECTORY_PATH, `${dir.name}_queue.json`);

        // Generate the call graph for the subdirectory
        let graphData = await CallGraphForSubdirectory(subDataPath, graphFilePath);
        // Perform DFS using the generated call graph and save the traversal queue
        initiateTraversal(graphFilePath, subDataPath, queueFilePath,graphData);
    }
}

/**
 * The main function that orchestrates the execution of the program.
 */
async function main() {
    try {
        await traverseAndGenerate(DB_DIRECTORY_PATH);
        console.log(
            "Completed generating call graphs and traversal queues for all subdirectories."
        );
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
