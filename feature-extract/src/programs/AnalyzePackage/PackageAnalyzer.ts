import path from 'path'
import promises from 'fs/promises'
import { extractFeatureFromPackage } from '../../feature-extract'
import { getErrorInfo, getPackagesFromDir } from '../../util'
import { getConfig } from '../../config'
import { Logger } from '../../Logger'

/**
 * Get the result of extracting features
 * @param fileName the name of the npm package
 * @param featurePosPath the absolute path to the feature position file
 * @returns the result of extracting features
 */
function getAnalyzeResult (fileName: string, featurePosPath: string): string {
  return `Finished extracting features of ${fileName}, recorded at ${featurePosPath}`
}

/**
 * Extract the features of a single npm package
 * @param packagePath the absolute path to npm package
 * @param featureDirPath the absolute directory path to save feature files
 * @param featurePosDirPath the absolute directory path to save feature position files
 * @returns the result of extracting features
 */
async function analyzeSinglePackage (packagePath: string, featureDirPath: string, featurePosDirPath: string) {
  const result = await extractFeatureFromPackage(packagePath, featureDirPath)
  const packageName = path.basename(path.dirname(packagePath))
  try {
    const featurePosPath = path.join(featurePosDirPath, `${packageName}.json`)
    Logger.info(getAnalyzeResult(packageName, featurePosPath))
    await promises.writeFile(featurePosPath, getConfig().positionRecorder!.serializeRecord())
    return result
  } catch (error) {
    Logger.error(getErrorInfo(error))
    return null
  }
}

/**
 * Extract the features of all npm packages in the directory
 * @param packageDirPath the absolute directory path to npm package
 * @param featureDirPath the absolute directory path to save feature files
 * @param featurePosDirPath the absolute directory path to save feature position files
 */
export async function analyzePackages (packageDirPath: string, featureDirPath: string, featurePosDirPath: string) {
  try { await promises.mkdir(featureDirPath) } catch (e) {}
  try { await promises.mkdir(featurePosDirPath) } catch (e) {}
  const packagesPath = await getPackagesFromDir(packageDirPath)
  for (const packagePath of packagesPath) {
    await analyzeSinglePackage(packagePath, featureDirPath, featurePosDirPath)
  }
}
