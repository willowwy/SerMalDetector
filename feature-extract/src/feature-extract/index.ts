import path from 'path'
import { getPackageFeatureInfo} from './PackageFeatureInfo'

/**
 * Extract features from the npm package and save the features to the feature file
 * @param packagePath the directory of the npm package, where there should be a package.json file
 * @returns the path of the feature file and feature information
 */
export async function extractFeatureFromPackage(packagePath: string, CallGraph: any) {
  await getPackageFeatureInfo(packagePath, CallGraph)
  return
}
