// index.js
// import fs from "fs";
import path from "path";
import CallGraphForSubdirectory from "./generateCallGraph";
import { initiateTraversal } from "./dfsTraversal";


/**
 * Traverses the root directory, generates call graphs and traversal queues for each subdirectory,
 * and orchestrates the execution of the program.
 * @param {string} rootDirectoryPath - The path to the root directory.
 */
export async function generateCallGraph(subDataPath,graphDirPath,queueDirPath) {
    try {
        const PackageName = path.basename(subDataPath);
        const graphFilePath = path.join(graphDirPath, `${PackageName}_cg.json`);
        const queueFilePath = path.join(queueDirPath, `${PackageName}_queue.json`);

        await CallGraphForSubdirectory(subDataPath, graphFilePath);
        initiateTraversal(graphFilePath, queueFilePath);

        console.log("Completed generating call graph for" + dir.name);
    } catch (error) {
        console.error("An error occurred:", error);
    }
}