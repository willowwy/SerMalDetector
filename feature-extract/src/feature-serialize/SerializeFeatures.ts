import { promises as fs } from 'fs';
import { initiateTraversal } from "./dfsTraversal";
import { Logger } from '../Logger';

// Define the structure for the mapping of function names to feature names.
interface FeatureMapping {
    [functionName: string]: string[];
}

// Define the type for an array of feature positions, including file paths, function names, and features.
type FeaturePositionsArray = Array<{
    filePath: string;
    functions: Array<{
        functionName: string;
        features: Array<{
            featureName: string;
            content: {
                start: { line: number; column: number; index?: number };
                end: { line: number; column: number; index?: number };
            } | string;
        }>;
    }>;
}>;

/**
 * Preprocesses the feature positions from a specified file path.
 * It reads the file, parses the JSON data, and constructs a mapping from function names to feature names.
 * 
 * @param featurePosFilePath - The file path to the JSON containing the feature positions.
 * @returns A promise resolving to the mapping of function names to feature names.
 */
async function preProcessFeaturePositions(featurePosFilePath: string): Promise<FeatureMapping> {
    try {
        const rawData = await fs.readFile(featurePosFilePath, 'utf8');
        const featurePositions: FeaturePositionsArray = JSON.parse(rawData);
        const functionToFeaturesMap: FeatureMapping = {};

        // Iterate over each feature position to map function names to their features.
        featurePositions.forEach(({ functions }) => {
            functions.forEach(({ functionName, features }) => {
                functionToFeaturesMap[functionName] = features.map(f => f.featureName);
            });
        });

        return functionToFeaturesMap;
    } catch (error) {
        Logger.error('Error reading the feature positions file:' + error);
        throw error; // Rethrow the error to ensure it's caught by the caller.
    }
}

/**
 * Serializes features by correlating function call queues with feature positions.
 * Produces a mapping from file paths to lists of feature names based on the given file paths.
 * 
 * @param featurePosFilePath - Path to the JSON file containing feature positions.
 * @param CallGraphFilePath - Path to the call graph data file.
 * @param funcQueueDirPath - Directory path where the function queue files are stored.
 * @returns A promise that resolves to an object mapping file paths to arrays of feature names.
 */
export async function serializeFeatures(featurePosFilePath: string, CallGraphFilePath: string, resultFilePath: string): Promise<{ [key: string]: string[] }> {
    const Filetofuncs = await initiateTraversal(CallGraphFilePath);
    const FunctoFeatures = await preProcessFeaturePositions(featurePosFilePath);
    const FiletoFeatures: { [key: string]: string[] } = {};

    // Check if 'packageJSON' key exists in FunctoFeatures and store the associated features.
    if ('packageJSON' in FunctoFeatures) {
        FiletoFeatures['package.json'] = FunctoFeatures['packageJSON'];
    }
    
    // Correlate file paths with lists of feature names.
    Object.entries(Filetofuncs).forEach(([filePath, functionNames]) => {
        const featuresList: string[] = []; 

        // Aggregate features for each function found in the file.
        functionNames.forEach(functionName => {
            const features = FunctoFeatures[functionName];
            if (features) {
                featuresList.push(...features);
            }
        });

        FiletoFeatures[filePath] = featuresList;
    });

    // Optionally, write the result to a file.
    await fs.writeFile(resultFilePath, JSON.stringify(FiletoFeatures, null, 2));

    return FiletoFeatures;
}
