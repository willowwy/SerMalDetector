var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import chalk from 'chalk';
import promises from 'fs/promises';
import path from 'path';
import { isUTF8WithBOM, readFileFromUTF8WithBOM } from '../util/FileUtil';
import { Logger } from '../Logger';
/**
 * Get the compressed npm package file size
 * @param tgzPath the compressed npm package file path
 * @returns the package size
 */
export function getPackageSize(tgzPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileInfo = yield promises.stat(tgzPath);
        return fileInfo.size;
    });
}
/**
 * Extract package information from package.json
 * @param packageJsonPath the path to package.json
 * @returns package information
 */
export function getPackageJSONInfo(packageJsonPath) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const result = {
            dependencyNumber: 0,
            devDependencyNumber: 0,
            includeInstallScript: false,
            installCommand: [],
            executeJSFiles: [],
        };
        let fileContent = '';
        if (yield isUTF8WithBOM(packageJsonPath)) {
            fileContent = yield readFileFromUTF8WithBOM(packageJsonPath);
        }
        else {
            fileContent = yield promises.readFile(packageJsonPath, { encoding: 'utf-8' });
        }
        const metaData = JSON.parse(fileContent);
        result.dependencyNumber = Object.keys((metaData === null || metaData === void 0 ? void 0 : metaData.dependencies) || {}).length;
        result.devDependencyNumber = Object.keys((metaData === null || metaData === void 0 ? void 0 : metaData.devDependencies) || {}).length;
        result.includeInstallScript = Boolean((_a = metaData === null || metaData === void 0 ? void 0 : metaData.scripts) === null || _a === void 0 ? void 0 : _a.preinstall) || Boolean((_b = metaData === null || metaData === void 0 ? void 0 : metaData.scripts) === null || _b === void 0 ? void 0 : _b.install) || Boolean((_c = metaData === null || metaData === void 0 ? void 0 : metaData.scripts) === null || _c === void 0 ? void 0 : _c.postinstall);
        const executeJSFiles = [];
        const preinstall = (_d = metaData === null || metaData === void 0 ? void 0 : metaData.scripts) === null || _d === void 0 ? void 0 : _d.preinstall;
        const install = (_e = metaData === null || metaData === void 0 ? void 0 : metaData.scripts) === null || _e === void 0 ? void 0 : _e.install;
        const postinstall = (_f = metaData === null || metaData === void 0 ? void 0 : metaData.scripts) === null || _f === void 0 ? void 0 : _f.postinstall;
        const parentDir = path.dirname(packageJsonPath);
        if (preinstall) {
            result.installCommand.push(preinstall);
            let jsFile = extractJSFilePath(preinstall);
            if (jsFile) {
                try {
                    jsFile = path.join(parentDir, jsFile);
                    yield promises.access(jsFile);
                    executeJSFiles.push(jsFile);
                }
                catch (error) {
                    Logger.warning(chalk.red(`The file in ${packageJsonPath} doesn't exist.`));
                }
            }
        }
        if (install) {
            result.installCommand.push(install);
            let jsFile = extractJSFilePath(install);
            if (jsFile) {
                try {
                    jsFile = path.join(parentDir, jsFile);
                    yield promises.access(jsFile);
                    executeJSFiles.push(jsFile);
                }
                catch (error) {
                    Logger.warning(chalk.red(`The file in ${packageJsonPath} doesn't exist.`));
                }
            }
        }
        if (postinstall) {
            result.installCommand.push(postinstall);
            let jsFile = extractJSFilePath(postinstall);
            if (jsFile) {
                jsFile = path.join(parentDir, jsFile);
                try {
                    yield promises.access(jsFile);
                    executeJSFiles.push(jsFile);
                }
                catch (error) {
                    Logger.warning(chalk.red(`The file in ${packageJsonPath} doesn't exist.`));
                }
            }
        }
        result.executeJSFiles = executeJSFiles;
        return result;
    });
}
/**
 * Extract the path to the JS file in the script content
 * @param scriptContent preinsta/install/postinstall script in package.json
 * @returns the path to the JS file in the script content
 */
export function extractJSFilePath(scriptContent) {
    const jsFileReg = /node\s+?(.+?\.js)/;
    const matchResult = scriptContent.match(jsFileReg);
    if (matchResult != null) {
        return matchResult[1];
    }
    return undefined;
}
//# sourceMappingURL=PackageJSONInfo.js.map