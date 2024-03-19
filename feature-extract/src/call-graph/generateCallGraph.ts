import { exec } from 'child_process';
import path from 'path';

/**
 * Generates a call graph for a single subdirectory.
 * @param packagePath - Path to the subdirectory for which to generate the call graph.
 * @param CallGraphFilePath - The path where the call graph file will be saved.
 */
export async function CallGraphForPackage(packagePath: string, CallGraphFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const dirName: string = path.basename(packagePath);
        const PackagePath: string = path.join(packagePath, "package");

        const command: string = `npx jelly -j ${CallGraphFilePath} ${PackagePath}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                // Silently handle the error, only reject the promise without logging to console
                reject(error);
                return;
            }
            // if (stdout) console.log(`Standard output for ${dirName}:`, stdout);
            // if (stderr) console.error(`Standard error for ${dirName}:`, stderr);
            // console.log(`Call graph generated for: ${dirName}`);
            resolve();
        });
    });
}
