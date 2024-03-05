import fs, { readdirSync } from 'fs'
import path, { basename, join } from 'path'

export function getRootDirectory () {
  if (isProduction()) {
    return __dirname
  }
  const currentFilePath = process.argv[1]
  let projectRootPath = currentFilePath

  while (!fs.existsSync(path.join(projectRootPath, 'package.json'))) {
    projectRootPath = path.dirname(projectRootPath)
  }

  return projectRootPath
}

/**
 * Get all packages from a directory.
 * @param packageDirPath the path to the directory to be searched
 * @returns all pakcages in the directory
 */
export async function getPackagesFromDir (packageDirPath: string) {
  const result: string[] = []
  async function resolve (dirPath: string) {
    const files = readdirSync(dirPath, { withFileTypes: true })
    for (const file of files) {
      if (file.name === 'package.json'/* && basename(dirPath) === 'package'*/) {
        result.push(dirPath)
        return
      }
      if (file.isDirectory() && file.name !== 'node_modules') {
        await resolve(join(dirPath, file.name))
      }
    }
  }
  await resolve(packageDirPath)
  return result
}

/**
 * Get the valid file name.
 * @param fileName the file name to be checked
 * @returns a valid file name string and replaces all / in fileName with #
 */
export function getValidFileName (fileName: string) {
  return fileName.replace('/', '#')
}

export function getErrorInfo (error: Error) {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return `error name: ${error.name}\nerror message: ${error.message}\nerror stack: ${error.stack}`
}

export function isProduction () {
  return !!process.env.NODE_ENV
}
