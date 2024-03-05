import { accessSync, constants } from 'fs'
import { Logger } from './Logger'
import { analyzePackages } from './programs/AnalyzePackage/PackageAnalyzer'

function showUsage () {
  Logger.info(
`node main.js $package_dir_path $feature_dir_path $feature_pos_dir_path.
\t$package_dir_path is absolute path to the parent directory of the npm package which should have a file named package.json.
\t$feature_dir_path is absolute path to the parent directory of the feature files.
\t$feature_pos_dir_path is absolute path to the parent directory of the feature position files.`
  )
}

async function main () {
  if (process.argv.length === 5) {
    const packageDirPath = process.argv[2]
    const featureDirPath = process.argv[3] 
    const featurePosDirPath = process.argv[4]
    try {
      accessSync(packageDirPath, constants.F_OK | constants.R_OK)
      await analyzePackages(packageDirPath, featureDirPath, featurePosDirPath)
    } catch (error) {
      Logger.error(`Error: ${(error as Error).message}`)
      Logger.error(`Stack: ${(error as Error).stack}`)
    }
  } else {
    showUsage()
  }

}

main()
