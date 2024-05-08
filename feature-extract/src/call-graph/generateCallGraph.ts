import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Logger } from '../Logger';
import { callgraphRoundLimit } from '../index';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 2MB in bytes
const MAX_HEAP = 14336
/**
 * Asynchronously reads a directory and returns an array of large files (larger than MAX_FILE_SIZE) within it.
 * 
 * @param dir The directory to search for large files.
 * @returns An array of paths to large files.
 */
async function findLargeFiles(dir: string): Promise<string[]> {
    let results: string[] = [];

    async function recurse(currentPath: string) {
        let entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
        for (let entry of entries) {
            let fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                await recurse(fullPath); // Recursive call to traverse subdirectories
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                let stats = await fs.promises.stat(fullPath);
                if (stats.size > MAX_FILE_SIZE) {
                    results.push(fullPath); // Save paths to files larger than the size limit
                }
            }
        }
    }

    await recurse(dir);
    return results;
}

/**
 * Generates a call graph for a specified package directory and saves it to a file.
 * After generation, the call graph data is read from the file and returned.
 * 
 * @param packagePath The path to the package directory for which to generate the call graph.
 * @param callGraphFilePath The file path where the call graph should be saved.
 * @returns A promise that resolves with an integer representing the result of the call graph generation process.
 */
export async function generateCallGraphForPackage(packagePath: string, callGraphFilePath: string): Promise<number> {
    try {
        // Check if the package directory is empty or missing package.json
        await validatePackageDirectory(packagePath);

        // Find large files in the package directory
        let largeFiles = await findLargeFiles(packagePath);
        let excludeEntries = largeFiles.map(file => `${file}`).join(' ');

        // Construct the command
        const command = `node --max-old-space-size=${MAX_HEAP} $(which npx) jelly -j ${callGraphFilePath} ${packagePath} --timeout 20 --no-callgraph-external ${excludeEntries ? '--exclude-entries ' + excludeEntries : ''} --ignore-unresolved --no-callgraph-implicit --no-callgraph-native `;

        // Spawn a child process to execute the command
        const childProcess = spawn(command, { shell: true });

        // Listen for data on stdout
        childProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes("Time limit reached, analysis aborted")) {
                Logger.warn(packagePath + "Time limit reached, analysis aborted");
            }
        });

        // Handle errors
        childProcess.on('error', (error) => {
            Logger.error(packagePath + `:Failed to generate call graph: ${error.message}`);
            return Promise.resolve(-1); // Return -1 indicating abnormal termination
        });

        // Handle process exit
        return new Promise<number>((resolve) => {
            childProcess.on('exit', (code) => {
                if (code !== 0) {
                    Logger.error(packagePath + `:Failed to generate call graph. Process exited with code ${code}`);
                    resolve(-1); // Return -1 indicating abnormal termination
                } else {
                    resolve(1); // Return 1 indicating normal termination
                }
            });
        });
    } catch (error) {
        Logger.error(`Failed to generate call graph: ${error.message}`);
        return Promise.resolve(-1); // Return -1 indicating abnormal termination
    }
}



/**
 * Validates the package directory to ensure it is not empty and contains a package.json file.
 * 
 * @param packagePath The path to the package directory to validate.
 */
async function validatePackageDirectory(packagePath: string): Promise<void> {
    try {
        const files = await fs.promises.readdir(packagePath);
        if (files.length === 0) {
            Logger.warn(`The package directory at ${packagePath} is empty. The process will stop.`);
            process.exit();
        } else if (!files.includes('package.json')) {
            Logger.warn(`No package.json found in the package directory at ${packagePath}. This package may not conform to standards. The process will stop.`);
            process.exit();
        }
    } catch (error) {
        Logger.error(`Failed to read the package directory: ${error.message}`);
        throw error; // Re-throw the error after logging it
    }
}
