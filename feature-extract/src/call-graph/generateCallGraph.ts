import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

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
    return new Promise((resolve, reject) => {
        fs.readFile(jsonFilePath, 'utf8', (err, data) => {
            if (err) {
                reject(new Error(`Failed to read JSON file: ${err.message}`));
                return;
            }
            try {
                const jsonData: CallGraph = JSON.parse(data);
                resolve(jsonData);
            } catch (parseError) {
                reject(new Error(`Failed to parse JSON file: ${parseError.message}`));
            }
        });
    });
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
    const packageDirectory = path.join(packagePath, "package");
    const command = `npx jelly -j ${callGraphFilePath} ${packageDirectory} -m /home/wwy/SerMalDetector/data/call-graphs/cg.html`;

    // Execute the command to generate the call graph
    await new Promise<void>((resolve, reject) => {
        exec(command, (error) => {
            if (error) {
                reject(new Error(`Failed to generate call graph: ${error.message}`));
                return;
            }
            resolve();
        });
    });

    // After the call graph has been generated, read and return it
    return await readJsonData(callGraphFilePath);
}
