import path from 'path'
import promises from 'fs/promises'
import { promisify } from 'util';
import fs from 'fs';
import { Worker, parentPort, workerData } from 'worker_threads'
import { extractFeatureFromPackage } from '../../feature-extract'
import { generateCallGraphForPackage } from '../../call-graph/generateCallGraph'
import { serializeFeatures } from '../../feature-serialize/SerializeFeatures'
import { getErrorInfo, getPackageFromDir } from '../../util'
import { getConfig } from '../../config'
import { Logger } from '../../Logger'
import { readdirSync } from 'fs'


/**
 * Extract the features of a single npm package
 * @param packagePath the absolute path to npm package
 * @param featurePosDirPath the absolute directory path to save feature position files
 * @returns the result of extracting features
 */
export async function analyzeSinglePackage(
  packagePath: string,
  featurePosDirPath: string,
  CallGraphDirPath: string,
  SequentialFeatureDirPath: string) {
  const packageName = path.basename(packagePath)
  const actualPackagePath = await getPackageFromDir(packagePath)
  if (!actualPackagePath) {
    Logger.warn("Package " + packageName + " is empty or without package.json");
    return null;
  }

  //generate call graph
  const CallGraphFilePath = path.join(CallGraphDirPath, `${packageName}_cg.json`)
  try {
    await generateCallGraphForPackage(actualPackagePath, CallGraphFilePath)
    Logger.info(`Finished generating call graphs of ${packageName}, recorded at ${CallGraphFilePath}`)
  } catch (error) {
    Logger.error(getErrorInfo(error))
    return null
  }

  //extract feature
  const featurePosPath = path.join(featurePosDirPath, `${packageName}_fp.json`)
  try {
    await extractFeatureFromPackage(packagePath, CallGraphFilePath, actualPackagePath)
    // Logger.info(`Finished extracting features of ${packageName}, recorded at ${featurePosPath}`)
    await promises.writeFile(featurePosPath, getConfig().positionRecorder!.serializeRecord())
  } catch (error) {
    Logger.error(getErrorInfo(error))
    return null
  }

  //serialize features
  const resultFilePath = path.join(SequentialFeatureDirPath, `${packageName}_rst.json`)
  try {
    await serializeFeatures(featurePosPath, CallGraphFilePath, resultFilePath)
    Logger.info(`${packageName} finished, recorded at ${resultFilePath}`)
  } catch (error) {
    Logger.error(getErrorInfo(error))
    return null
  }
}

/**
 * Extract the features of all npm packages in the directory
 * @param packageDirPath the absolute directory path to npm package
 * @param featurePosDirPath the absolute directory path to save feature position files
 */
export async function analyzePackages(packageDirPath: string, featurePosDirPath: string, CallGraphDirPath: string, SequentialFeatureDirPath: string) {
  try { await promises.mkdir(featurePosDirPath) } catch (e) { }
  try { await promises.mkdir(CallGraphDirPath) } catch (e) { }
  try { await promises.mkdir(SequentialFeatureDirPath) } catch (e) { }

  let packagesPath: string[] = []
  for (const packagePath of readdirSync(packageDirPath)) {
    if ((await promises.stat(path.join(packageDirPath, packagePath))).isDirectory()) {
      packagesPath.push(path.join(packageDirPath, packagePath))
    }
  }
  return packagesPath
}

export async function analyzePackagesMaster(packagesPath: string[], featurePosDirPath: string, CallGraphDirPath: string, SequentialFeatureDirPath: string) {
  // const workersCount = os.cpus().length
  // FIXME: use 8 workers for now because of the memory limit, or the program will be killed
  const workersCount = 4
  const workload = Math.ceil(packagesPath.length / workersCount)
  const workers: Worker[] = []
  for (let i = 0; i < workersCount; i++) {
    const start = i * workload
    const end = start + workload
    const worker = new Worker(__filename, {
      workerData: {
        workerId: i,
        packagesPath: packagesPath.slice(start, end),
        featurePosDirPath,
        CallGraphDirPath,
        SequentialFeatureDirPath
      }
    })
    workers.push(worker)
  }
  for (const worker of workers) {
    worker.on('exit', (exitCode: number) => {
      Logger.info(`Worker stopped with exit code ${exitCode}`)
    })
  }
}

export async function analyzePackagesWorker() {
  const { workerId, packagesPath, featurePosDirPath, CallGraphDirPath, SequentialFeatureDirPath } = workerData
  // Logger.info(`Worker ${workerId} started`)
  for (const packagePath of packagesPath) {
    await analyzeSinglePackage(packagePath, featurePosDirPath, CallGraphDirPath, SequentialFeatureDirPath)
  }
  Logger.info(`Worker ${workerId} finished`)
  if (parentPort) {
    parentPort.postMessage(`Worker ${workerId} finished`)
  }
}