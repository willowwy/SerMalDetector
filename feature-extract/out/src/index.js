var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { accessSync, constants } from 'fs';
import { Logger } from './Logger';
import { analyzePackages } from './programs/AnalyzePackage/PackageAnalyzer';
function showUsage() {
    Logger.info(`node main.js $package_dir_path $feature_dir_path $feature_pos_dir_path.
\t$package_dir_path is absolute path to the parent directory of the npm package which should have a file named package.json.
\t$feature_dir_path is absolute path to the parent directory of the feature files.
\t$feature_pos_dir_path is absolute path to the parent directory of the feature position files.`);
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.argv.length === 5) {
            const packageDirPath = process.argv[2];
            const featureDirPath = process.argv[3];
            const featurePosDirPath = process.argv[4];
            try {
                accessSync(packageDirPath, constants.F_OK | constants.R_OK);
                yield analyzePackages(packageDirPath, featureDirPath, featurePosDirPath);
            }
            catch (error) {
                Logger.error(`Error: ${error.message}`);
                Logger.error(`Stack: ${error.stack}`);
            }
        }
        else {
            showUsage();
        }
    });
}
main();
//# sourceMappingURL=index.js.map