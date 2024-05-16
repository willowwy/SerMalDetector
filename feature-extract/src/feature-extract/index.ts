import fs from 'fs/promises'
import { getPackageFeatureInfo } from './PackageFeatureInfo'

/**
 * Extract features from the npm package and save the features to the feature file
 * @param packagePath the directory of the npm package, where there should be a package.json file
 * @returns the path of the feature file and feature information
 */
export async function extractFeatureFromPackage(packagePath: string, CallGraphFilePath: string, actualPackagePath: string, ifCallGraphGenerated: number) {
  let CallGraphFiles: string[] = []
  let CallGraphFunctions: { [key: string]: string } = {}

  async function readTargetData(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const json = JSON.parse(data);

      if (json.entries) {
        CallGraphFiles = json.entries;
      }
      if (json.functions && ifCallGraphGenerated === 1) {
        CallGraphFunctions = json.functions;
      }
    } catch (error) {
      console.error('Error while reading the JSON file:', error);
    }
  }

  await readTargetData(CallGraphFilePath)

  if (ifCallGraphGenerated === -1) {
    const n = 1 + 1
  }
  await getPackageFeatureInfo(packagePath, CallGraphFiles, CallGraphFunctions, actualPackagePath, ifCallGraphGenerated)
  return
}
