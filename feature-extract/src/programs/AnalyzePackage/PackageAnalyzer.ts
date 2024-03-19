import path from 'path'
import promises from 'fs/promises'
import { Worker, parentPort, workerData } from 'worker_threads'
import { extractFeatureFromPackage } from '../../feature-extract'
import { CallGraphForPackage } from '../../call-graph/generateCallGraph'
import { serializeFeatures } from '../../feature-serialize/SerializeFeatures'
import { getErrorInfo } from '../../util'
import { getConfig } from '../../config'
import { Logger } from '../../Logger'
import { readdirSync } from 'fs'

/**
 * Get the result of extracting features
 * @param fileName the name of the npm package
 * @param featurePosPath the absolute path to the feature position file
 * @returns the result of extracting features
 */
function getAnalyzeResult(fileName: string, featurePosPath: string): string {
  return `Finished extracting features of ${fileName}, recorded at ${featurePosPath}`
}

/**
 * Extract the features of a single npm package
 * @param packagePath the absolute path to npm package
 * @param featureDirPath the absolute directory path to save feature files
 * @param featurePosDirPath the absolute directory path to save feature position files
 * @returns the result of extracting features
 */
export async function analyzeSinglePackage(packagePath: string, featureDirPath: string, featurePosDirPath: string, CallGraphDirPath: string, featureQueueDirPath: string, SequentialFeatureDirPath: string) {
  const packageName = path.basename(packagePath)

  //generate call graph
  const CallGraphFilePath = path.join(CallGraphDirPath, `${packageName}_cg.json`)
  try {
    await CallGraphForPackage(packagePath, CallGraphFilePath)
  } catch (error) {
    Logger.error(getErrorInfo(error))
    return null
  }

  //extract feature
  const featurePosPath = path.join(featurePosDirPath, `${packageName}.json`)
  try {
    await extractFeatureFromPackage(packagePath, featureDirPath)
    Logger.info(getAnalyzeResult(packageName, featurePosPath))
    await promises.writeFile(featurePosPath, getConfig().positionRecorder!.serializeRecord())
  } catch (error) {
    Logger.error(getErrorInfo(error))
    return null
  }

  //serialize features
  const queueFilePath = path.join(featureQueueDirPath, `${packageName}_queue.json`)
  const resultFilePath = path.join(SequentialFeatureDirPath, `${packageName}_result.json`)
  try {
    await serializeFeatures(featurePosPath, CallGraphFilePath, queueFilePath, resultFilePath)
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
export async function analyzePackages(packageDirPath: string, featureDirPath: string, featurePosDirPath: string, CallGraphDirPath: string, featureQueueDirPath: string, SequentialFeatureDirPath: string) {
  try { await promises.mkdir(featureDirPath) } catch (e) { }
  try { await promises.mkdir(featurePosDirPath) } catch (e) { }
  try { await promises.mkdir(CallGraphDirPath) } catch (e) { }
  try { await promises.mkdir(featureQueueDirPath) } catch (e) { }
  try { await promises.mkdir(SequentialFeatureDirPath) } catch (e) { }

  let packagesPath: string[] = []
  for (const packagePath of readdirSync(packageDirPath)) {
    if ((await promises.stat(path.join(packageDirPath, packagePath))).isDirectory()) {
      packagesPath.push(path.join(packageDirPath, packagePath))
    }
  }
  return packagesPath
}

export async function analyzePackagesMaster(packagesPath: string[], featureDirPath: string, featurePosDirPath: string, CallGraphDirPath: string, featureQueueDirPath: string, SequentialFeatureDirPath: string) {
  // const workersCount = os.cpus().length
  // FIXME: use 8 workers for now because of the memory limit, or the program will be killed
  const workersCount = 8
  const workload = Math.ceil(packagesPath.length / workersCount)
  const workers: Worker[] = []
  for (let i = 0; i < workersCount; i++) {
    const start = i * workload
    const end = start + workload
    const worker = new Worker(__filename, {
      workerData: {
        workerId: i,
        packagesPath: packagesPath.slice(start, end),
        featureDirPath,
        featurePosDirPath,
        CallGraphDirPath,
        featureQueueDirPath,
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
  const { workerId, packagesPath, featureDirPath, featurePosDirPath, CallGraphDirPath, featureQueueDirPath, SequentialFeatureDirPath } = workerData
  Logger.info(`Worker ${workerId} started`)
  for (const packagePath of packagesPath) {
    await analyzeSinglePackage(packagePath, featureDirPath, featurePosDirPath, CallGraphDirPath, featureQueueDirPath, SequentialFeatureDirPath)
  }
  Logger.info(`Worker ${workerId} finished`)
  if (parentPort) {
    parentPort.postMessage(`Worker ${workerId} finished`)
  }
}