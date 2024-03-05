var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import path from 'path';
import promises from 'fs/promises';
import { getPackageJSONInfo } from './PackageJSONInfo';
import { getDomainPattern, IP_Pattern, Network_Command_Pattern, SensitiveStringPattern } from './Patterns';
import { getAllJSFilesInInstallScript } from './GetInstallScripts';
import { extractFeaturesFromJSFileByAST } from './AST';
import { matchUseRegExp } from './RegExp';
import { PositionRecorder } from './PositionRecorder';
import { setPositionRecorder } from '../config';
const ALLOWED_MAX_JS_SIZE = 2 * 1024 * 1024;
/**
 * Extract features from the npm package
 * @param packagePath the directory of the npm package, where there should be a package.json file
 */
export function getPackageFeatureInfo(packagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const positionRecorder = new PositionRecorder();
        const result = {
            includeInstallScript: false,
            includeIP: false,
            useBase64Conversion: false,
            useBase64ConversionInScript: false,
            includeBase64String: false,
            includeBase64StringInScript: false,
            includeByteString: false,
            includeDomain: false,
            includeDomainInScript: false,
            useBuffer: false,
            useEval: false,
            useProcess: false,
            useProcessInScript: false,
            useFileSystem: false,
            useFileSystemInScript: false,
            useNetwork: false,
            useNetworkInScript: false,
            useProcessEnv: false,
            useProcessEnvInScript: false,
            useEncryptAndEncode: false,
            useOperatingSystem: false,
            includeSensitiveFiles: false,
            installCommand: [],
            executeJSFiles: [],
        };
        const packageJSONPath = path.join(packagePath, 'package.json');
        const packageJSONInfo = yield getPackageJSONInfo(packageJSONPath);
        Object.assign(result, packageJSONInfo);
        if (packageJSONInfo.includeInstallScript) {
            positionRecorder.addRecord('includeInstallScript', {
                filePath: packageJSONPath,
                content: packageJSONInfo.installCommand[0]
            });
        }
        // analyze commands in the install script 
        for (const scriptContent of packageJSONInfo.installCommand) {
            {
                const matchResult = scriptContent.match(IP_Pattern);
                if (matchResult != null) {
                    result.includeIP = true;
                    positionRecorder.addRecord('includeIP', { filePath: packageJSONPath, content: scriptContent });
                }
            }
            {
                const matchResult = scriptContent.match(getDomainPattern());
                if (matchResult != null) {
                    result.includeDomainInScript = true;
                    positionRecorder.addRecord('includeDomainInScript', {
                        filePath: packageJSONPath,
                        content: scriptContent
                    });
                }
            }
            {
                const matchResult = scriptContent.match(Network_Command_Pattern);
                if (matchResult != null) {
                    result.useNetworkInScript = true;
                    positionRecorder.addRecord('useNetworkInScript', {
                        filePath: packageJSONPath,
                        content: scriptContent
                    });
                }
            }
            {
                const matchResult = scriptContent.match(SensitiveStringPattern);
                if (matchResult != null) {
                    result.includeSensitiveFiles = true;
                    positionRecorder.addRecord('includeSensitiveFiles', {
                        filePath: packageJSONPath,
                        content: scriptContent
                    });
                }
            }
        }
        // analyze JavaScript files in the install script
        yield getAllJSFilesInInstallScript(result.executeJSFiles);
        function traverseDir(dirPath) {
            var _a, e_1, _b, _c;
            return __awaiter(this, void 0, void 0, function* () {
                if (path.basename(dirPath) === 'node_modules') {
                    return;
                }
                const dir = yield promises.opendir(dirPath);
                try {
                    for (var _d = true, dir_1 = __asyncValues(dir), dir_1_1; dir_1_1 = yield dir_1.next(), _a = dir_1_1.done, !_a;) {
                        _c = dir_1_1.value;
                        _d = false;
                        try {
                            const dirent = _c;
                            const jsFilePath = path.join(dirPath, dirent.name);
                            const isInstallScriptFile = result.executeJSFiles.findIndex(filePath => filePath === jsFilePath) >= 0;
                            if (dirent.isFile() && (dirent.name.endsWith('.js') || isInstallScriptFile)) {
                                yield new Promise((resolve) => {
                                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                        const targetJSFilePath = path.join(dirPath, dirent.name);
                                        const jsFileContent = yield promises.readFile(targetJSFilePath, { encoding: 'utf-8' });
                                        const fileInfo = yield promises.stat(targetJSFilePath);
                                        if (fileInfo.size <= ALLOWED_MAX_JS_SIZE) {
                                            yield extractFeaturesFromJSFileByAST(jsFileContent, result, isInstallScriptFile, targetJSFilePath, positionRecorder);
                                            matchUseRegExp(jsFileContent, result, positionRecorder, targetJSFilePath);
                                        }
                                        resolve(true);
                                    }), 0);
                                });
                            }
                            else if (dirent.isDirectory()) {
                                yield traverseDir(path.join(dirPath, dirent.name));
                            }
                        }
                        finally {
                            _d = true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = dir_1.return)) yield _b.call(dir_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            });
        }
        yield traverseDir(packagePath);
        setPositionRecorder(positionRecorder);
        return result;
    });
}
//# sourceMappingURL=PackageFeatureInfo.js.map