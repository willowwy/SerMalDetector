var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs, { readdirSync } from 'fs';
import path, { join } from 'path';
export function getRootDirectory() {
    if (isProduction()) {
        return __dirname;
    }
    const currentFilePath = process.argv[1];
    let projectRootPath = currentFilePath;
    while (!fs.existsSync(path.join(projectRootPath, 'package.json'))) {
        projectRootPath = path.dirname(projectRootPath);
    }
    return projectRootPath;
}
/**
 * Get all packages from a directory.
 * @param packageDirPath the path to the directory to be searched
 * @returns all pakcages in the directory
 */
export function getPackagesFromDir(packageDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = [];
        function resolve(dirPath) {
            return __awaiter(this, void 0, void 0, function* () {
                const files = readdirSync(dirPath, { withFileTypes: true });
                for (const file of files) {
                    if (file.name === 'package.json' /* && basename(dirPath) === 'package'*/) {
                        result.push(dirPath);
                        return;
                    }
                    if (file.isDirectory() && file.name !== 'node_modules') {
                        yield resolve(join(dirPath, file.name));
                    }
                }
            });
        }
        yield resolve(packageDirPath);
        return result;
    });
}
/**
 * Get the valid file name.
 * @param fileName the file name to be checked
 * @returns a valid file name string and replaces all / in fileName with #
 */
export function getValidFileName(fileName) {
    return fileName.replace('/', '#');
}
export function getErrorInfo(error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `error name: ${error.name}\nerror message: ${error.message}\nerror stack: ${error.stack}`;
}
export function isProduction() {
    return !!process.env.NODE_ENV;
}
//# sourceMappingURL=index.js.map