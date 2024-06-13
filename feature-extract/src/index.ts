import { accessSync, constants, writeFileSync } from 'fs'
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import { Logger } from './Logger'
import { analyzeSinglePackage, analyzePackages, analyzePackagesMaster, analyzePackagesWorker } from './programs/AnalyzePackage/PackageAnalyzer'

function showUsage() {
  Logger.info(
    `node main.js [-p, -d] [$package_path, $package_dir_path] $call_graph_dir_path $feature_pos_dir_path $sequential_feature_dir_path.
\t$package_path is absolute path to the npm package which should have a file named package.json.
\t$package_dir_path is absolute path to the parent directory of the npm package which should have a file named package.json.
\t$call_graph_dir_path is absolute path to the parent directory of the call graph files.
\t$feature_pos_dir_path is absolute path to the parent directory of the feature position files.
\t$sequential_feature_dir_path is absolute path to the parent directory of the sequential feature files. `
  )
}
export const callgraphRoundLimit = 5
export const dfsDepthLimit = 3

async function main() {
  if (process.argv.length === 7) {
    const option = process.argv[2]
    const packageOrDirPath = process.argv[3]
    const CallGraphDirPath = process.argv[4]
    const featurePosDirPath = process.argv[5]
    const SequentialFeatureDirPath = process.argv[6]

    // const option = '-d'
    // const packageOrDirPath = 'data/.cache'
    // const featurePosDirPath = 'data/feature-positions'
    // const CallGraphDirPath = 'data/call-graphs'
    // const SequentialFeatureDirPath = 'data/result'

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
  }
  else {
    showUsage()
  }
}

if (isMainThread) {
  main()
} else {
  analyzePackagesWorker()
}
