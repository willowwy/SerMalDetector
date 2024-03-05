var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from 'path';
import promises from 'fs/promises';
import { extractFeatureFromPackage } from '../../feature-extract';
import { getErrorInfo, getPackagesFromDir } from '../../util';
import { getConfig } from '../../config';
import { Logger } from '../../Logger';
/**
 * Get the result of extracting features
 * @param fileName the name of the npm package
 * @param featurePosPath the absolute path to the feature position file
 * @returns the result of extracting features
 */
function getAnalyzeResult(fileName, featurePosPath) {
    return `Finished extracting features of ${fileName}, recorded at ${featurePosPath}`;
}
/**
 * Extract the features of a single npm package
 * @param packagePath the absolute path to npm package
 * @param featureDirPath the absolute directory path to save feature files
 * @param featurePosDirPath the absolute directory path to save feature position files
 * @returns the result of extracting features
 */
function analyzeSinglePackage(packagePath, featureDirPath, featurePosDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield extractFeatureFromPackage(packagePath, featureDirPath);
        const packageName = path.basename(path.dirname(packagePath));
        try {
            const featurePosPath = path.join(featurePosDirPath, `${packageName}.json`);
            Logger.info(getAnalyzeResult(packageName, featurePosPath));
            yield promises.writeFile(featurePosPath, getConfig().positionRecorder.serializeRecord());
            return result;
        }
        catch (error) {
            Logger.error(getErrorInfo(error));
            return null;
        }
    });
}
/**
 * Extract the features of all npm packages in the directory
 * @param packageDirPath the absolute directory path to npm package
 * @param featureDirPath the absolute directory path to save feature files
 * @param featurePosDirPath the absolute directory path to save feature position files
 */
export function analyzePackages(packageDirPath, featureDirPath, featurePosDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield promises.mkdir(featureDirPath);
        }
        catch (e) { }
        try {
            yield promises.mkdir(featurePosDirPath);
        }
        catch (e) { }
        const packagesPath = yield getPackagesFromDir(packageDirPath);
        for (const packagePath of packagesPath) {
            yield analyzeSinglePackage(packagePath, featureDirPath, featurePosDirPath);
        }
    });
}
//# sourceMappingURL=PackageAnalyzer.js.map