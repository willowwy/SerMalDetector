import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { Logger } from '../Logger';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const readdirAsync = fs.promises.readdir;

export interface CallGraph {
    entries: string[];
    files: string[];
    functions: { [key: string]: string };
    fun2fun: [number, number][];
}

/**
 * Asynchronously reads and parses a JSON file into a CallGraph object.
 * 
 * @param jsonFilePath The path to the JSON file.
 * @returns A promise that resolves to a CallGraph object.
 */
async function readJsonData(jsonFilePath: string): Promise<CallGraph> {
    try {
        const data = await readFileAsync(jsonFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        Logger.error(`Error reading or parsing JSON file: ${error.message}`);
        throw error; // Re-throw the error after logging it
    }
}

/**
 * Generates a call graph for a specified package directory and saves it to a file.
 * After generation, the call graph data is read from the file and returned.
 * 
 * @param packagePath The path to the package directory for which to generate the call graph.
 * @param callGraphFilePath The file path where the call graph should be saved.
 * @returns A promise that resolves to the call graph data read from the generated file.
 */
export async function generateCallGraphForPackage(packagePath: string, callGraphFilePath: string): Promise<CallGraph> {
    // Check if the package directory is empty or missing package.json
    try {
        const files = await readdirAsync(packagePath);
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
    
    const command = `node --max-old-space-size=8192 $(which npx) jelly -j ${callGraphFilePath} ${packagePath} --ignore-dependencies --ignore-unresolved --no-callgraph-implicit --no-callgraph-native --no-callgraph-external`;

    try {
        await execAsync(command);
    } catch (error) {
        Logger.error(`Failed to generate call graph: ${error.message}`);
        throw error; // Re-throw the error after logging it
    }

    return await readJsonData(callGraphFilePath);
}
