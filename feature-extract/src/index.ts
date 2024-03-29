import { accessSync, constants } from 'fs'
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import { Logger } from './Logger'
import { analyzeSinglePackage, analyzePackages, analyzePackagesMaster, analyzePackagesWorker } from './programs/AnalyzePackage/PackageAnalyzer'

function showUsage() {
  Logger.info(
    `node main.js [-p, -d] [$package_path, $package_dir_path] $feature_dir_path $feature_pos_dir_path.
\t$package_path is absolute path to the npm package which should have a file named package.json.
\t$package_dir_path is absolute path to the parent directory of the npm package which should have a file named package.json.
\t$feature_dir_path is absolute path to the parent directory of the feature files.
\t$feature_pos_dir_path is absolute path to the parent directory of the feature position files.`
  )
}
export const dfsDepthLimit = 5

async function main() {
  // if (process.argv.length === 6) {
  // const option = process.argv[2]
  // const packageOrDirPath = process.argv[3]
  // const featureDirPath = process.argv[4]
  // const featurePosDirPath = process.argv[5]
  // const CallGraphDirPath = process.argv[6]
  // const featureQueueDirPath = process.argv[7]

  const option = '-d'
  
  const packageOrDirPath = '/home/wwy/SerMalDetector/data/.decompressed-packages'
  // const featureDirPath = '/home/wwy/SerMalDetector/data/features'
  const featurePosDirPath = '/home/wwy/SerMalDetector/data/feature-positions'
  const CallGraphDirPath = '/home/wwy/SerMalDetector/data/call-graphs'
  const SequentialFeatureDirPath = '/home/wwy/SerMalDetector/data/result'
  

  try {
    if (option === '-d') {
      accessSync(packageOrDirPath, constants.F_OK | constants.R_OK)
      const packagesPath = await analyzePackages(packageOrDirPath, featurePosDirPath, CallGraphDirPath, SequentialFeatureDirPath)
      await analyzePackagesMaster(packagesPath, featurePosDirPath, CallGraphDirPath, SequentialFeatureDirPath)
      return
    } else
      if (option === '-p') {
        accessSync(packageOrDirPath, constants.F_OK | constants.R_OK)
        await analyzeSinglePackage(packageOrDirPath, featurePosDirPath, CallGraphDirPath, SequentialFeatureDirPath)
      } else {
        throw new Error('Invalid option. Please use -p or -d.')
      }
  } catch (error) {
    Logger.error(`Error: ${(error as Error).message}`)
    Logger.error(`Stack: ${(error as Error).stack}`)
  }
  // else {
  //   showUsage()
  // }
}

if (isMainThread) {
  main()
} else {
  analyzePackagesWorker()
}
