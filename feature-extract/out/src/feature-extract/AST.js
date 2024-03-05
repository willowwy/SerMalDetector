var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable no-lone-blocks */
import { parse } from '@babel/core';
import traverse from '@babel/traverse';
import { isMemberExpression } from '@babel/types';
import { base64_Pattern, getDomainPattern, IP_Pattern, SensitiveStringPattern } from './Patterns';
import { getFileLogger } from '../FileLogger';
const MAX_STRING_LENGTH = 66875;
/**
 * Analyze the JavaScript code by AST and extract the feature information.
 * @param code JavaScript code
 * @param featureSet feature information
 * @param isInstallScript whether the JavaScript file name is present in install script
 * @param targetJSFilePath current analyzed file path
 * @param positionRecorder feature position recorder
 * @returns feature information
 */
export function extractFeaturesFromJSFileByAST(code, featureSet, isInstallScript, targetJSFilePath, positionRecorder) {
    return __awaiter(this, void 0, void 0, function* () {
        function getRecord(path) {
            return {
                filePath: targetJSFilePath,
                content: path.node.loc
            };
        }
        const logger = yield getFileLogger();
        let ast;
        try {
            ast = parse(code, {
                sourceType: 'unambiguous'
            });
        }
        catch (error) {
            yield logger.log('Current analyzed file is ' + targetJSFilePath);
            const errorObj = error;
            yield logger.log(`ERROR MESSAGE: ${errorObj.name}: ${errorObj.message}`);
            yield logger.log('ERROR STACK:' + errorObj.stack);
        }
        try {
            traverse(ast, {
                CallExpression: function (path) {
                    // @ts-expect-error uselesss lint error
                    if (path.node.callee.name === 'require') {
                        if (path.node.arguments.length > 0 &&
                            // @ts-expect-error uselesss lint error
                            path.node.arguments[0].value === 'base64-js') {
                            featureSet.useBase64Conversion = true;
                            positionRecorder.addRecord('useBase64Conversion', getRecord(path));
                            if (isInstallScript) {
                                featureSet.useBase64ConversionInScript = true;
                                positionRecorder.addRecord('useBase64ConversionInScript', getRecord(path));
                            }
                        }
                        if (path.node.arguments.length > 0 &&
                            // @ts-expect-error uselesss lint error
                            path.node.arguments[0].value === 'child_process') {
                            featureSet.useProcess = true;
                            positionRecorder.addRecord('useProcess', getRecord(path));
                            if (isInstallScript) {
                                featureSet.useProcessInScript = true;
                                positionRecorder.addRecord('useProcessInScript', getRecord(path));
                            }
                        }
                        if (path.node.arguments.length > 0) {
                            // @ts-expect-error uselesss lint error
                            const importModuleName = path.node.arguments[0].value;
                            if (importModuleName === 'fs' ||
                                importModuleName === 'fs/promises' ||
                                importModuleName === 'path' ||
                                importModuleName === 'promise-fs') {
                                featureSet.useFileSystem = true;
                                positionRecorder.addRecord('useFileSystem', getRecord(path));
                                if (isInstallScript) {
                                    featureSet.useFileSystemInScript = true;
                                    positionRecorder.addRecord('useFileSystemInScript', getRecord(path));
                                }
                            }
                        }
                        if (path.node.arguments.length > 0) {
                            // @ts-expect-error uselesss lint error
                            const moduleName = path.node.arguments[0].value;
                            if (moduleName === 'http' ||
                                moduleName === 'https' ||
                                moduleName === 'nodemailer' ||
                                moduleName === 'axios' ||
                                moduleName === 'request' ||
                                moduleName === 'node-fetch' ||
                                moduleName === 'got') {
                                featureSet.useNetwork = true;
                                positionRecorder.addRecord('useNetwork', getRecord(path));
                                if (isInstallScript) {
                                    featureSet.useNetworkInScript = true;
                                    positionRecorder.addRecord('useNetworkInScript', getRecord(path));
                                }
                            }
                        }
                        if (path.node.arguments.length > 0) {
                            // @ts-expect-error uselesss lint error
                            const moduleName = path.node.arguments[0].value;
                            if (moduleName === 'dns') {
                                featureSet.includeDomain = true;
                                if (isInstallScript) {
                                    featureSet.includeDomainInScript = true;
                                }
                            }
                        }
                        if (path.node.arguments.length > 0) {
                            // @ts-expect-error uselesss lint error
                            const moduleName = path.node.arguments[0].value;
                            if (moduleName === 'crypto' || moduleName === 'zlib') {
                                featureSet.useEncryptAndEncode = true;
                                positionRecorder.addRecord('useEncryptAndEncode', getRecord(path));
                            }
                        }
                    }
                    if (isMemberExpression(path.node.callee) &&
                        // @ts-expect-error uselesss lint error
                        path.node.callee.object.name === 'os') {
                        featureSet.useOperatingSystem = true;
                        positionRecorder.addRecord('useOperatingSystem', getRecord(path));
                    }
                },
                StringLiteral: function (path) {
                    const content = path.node.value;
                    if (content === 'base64') {
                        featureSet.useBase64Conversion = true;
                        positionRecorder.addRecord('useBase64Conversion', getRecord(path));
                        if (isInstallScript) {
                            featureSet.useBase64ConversionInScript = true;
                            positionRecorder.addRecord('useBase64ConversionInScript', getRecord(path));
                        }
                    }
                    if (content.length >= MAX_STRING_LENGTH) {
                        return;
                    }
                    {
                        const matchResult = content.match(IP_Pattern);
                        if (matchResult != null) {
                            featureSet.includeIP = true;
                            positionRecorder.addRecord('includeIP', getRecord(path));
                        }
                    }
                    {
                        const matchResult = content.match(base64_Pattern);
                        if (matchResult != null) {
                            featureSet.includeBase64String = true;
                            if (isInstallScript) {
                                featureSet.includeBase64StringInScript = true;
                            }
                        }
                    }
                    {
                        const matchResult = content.match(getDomainPattern());
                        if (matchResult != null) {
                            featureSet.includeDomain = true;
                            positionRecorder.addRecord('includeDomain', getRecord(path));
                            if (isInstallScript) {
                                featureSet.includeDomainInScript = true;
                                positionRecorder.addRecord('includeDomainInScript', getRecord(path));
                            }
                        }
                    }
                    {
                        const matchResult = content.match(SensitiveStringPattern);
                        if (matchResult != null) {
                            featureSet.includeSensitiveFiles = true;
                            positionRecorder.addRecord('includeSensitiveFiles', getRecord(path));
                        }
                    }
                },
                MemberExpression: function (path) {
                    if (path.get('object').isIdentifier({ name: 'process' }) &&
                        path.get('property').isIdentifier({ name: 'env' })) {
                        featureSet.useProcessEnv = true;
                        positionRecorder.addRecord('useProcessEnv', getRecord(path));
                        if (isInstallScript) {
                            featureSet.useProcessEnvInScript = true;
                            positionRecorder.addRecord('useProcessEnvInScript', getRecord(path));
                        }
                    }
                    if (path.get('object').isIdentifier({ name: 'Buffer' }) &&
                        path.get('property').isIdentifier({ name: 'from' })) {
                        featureSet.useBuffer = true;
                        positionRecorder.addRecord('useBuffer', getRecord(path));
                    }
                },
                NewExpression: function (path) {
                    // @ts-expect-error uselesss lint error
                    if (path.node.callee.name === 'Buffer') {
                        featureSet.useBuffer = true;
                        positionRecorder.addRecord('useBuffer', getRecord(path));
                    }
                },
                ImportDeclaration: function (path) {
                    const moduleName = path.node.source.value;
                    if (path.node.source.value === 'base64-js') {
                        featureSet.useBase64Conversion = true;
                        positionRecorder.addRecord('useBase64Conversion', getRecord(path));
                        if (isInstallScript) {
                            featureSet.useBase64ConversionInScript = true;
                            positionRecorder.addRecord('useBase64ConversionInScript', getRecord(path));
                        }
                    }
                    if (path.node.source.value === 'child_process') {
                        featureSet.useProcess = true;
                        positionRecorder.addRecord('useProcess', getRecord(path));
                        if (isInstallScript) {
                            featureSet.useProcessInScript = true;
                            positionRecorder.addRecord('useProcessInScript', getRecord(path));
                        }
                    }
                    {
                        if (moduleName === 'fs' ||
                            moduleName === 'fs/promises' ||
                            moduleName === 'path' ||
                            moduleName === 'promise-fs') {
                            featureSet.useFileSystem = true;
                            positionRecorder.addRecord('useFileSystem', getRecord(path));
                            if (isInstallScript) {
                                featureSet.useFileSystemInScript = true;
                                positionRecorder.addRecord('useFileSystemInScript', getRecord(path));
                            }
                        }
                    }
                    {
                        if (moduleName === 'http' ||
                            moduleName === 'https' ||
                            moduleName === 'nodemailer' ||
                            moduleName === 'aixos' ||
                            moduleName === 'request' ||
                            moduleName === 'node-fetch') {
                            featureSet.useNetwork = true;
                            positionRecorder.addRecord('useNetwork', getRecord(path));
                            if (isInstallScript) {
                                featureSet.useNetworkInScript = true;
                                positionRecorder.addRecord('useNetworkInScript', getRecord(path));
                            }
                        }
                    }
                    {
                        if (moduleName === 'dns') {
                            featureSet.includeDomain = true;
                            if (isInstallScript) {
                                featureSet.includeDomainInScript = true;
                            }
                        }
                    }
                    {
                        if (moduleName === 'crypto' || moduleName === 'zlib') {
                            featureSet.useEncryptAndEncode = true;
                            positionRecorder.addRecord('useEncryptAndEncode', getRecord(path));
                        }
                    }
                },
                Identifier: function (path) {
                    if (path.node.name === 'eval') {
                        featureSet.useEval = true;
                        positionRecorder.addRecord('useEval', getRecord(path));
                    }
                }
            });
        }
        catch (error) {
            yield logger.log('Current analyzed file is ' + targetJSFilePath);
            const errorObj = error;
            yield logger.log(`ERROR MESSAGE: ${errorObj.name}: ${errorObj.message}`);
            yield logger.log('ERROR STACK:' + errorObj.stack);
        }
        return featureSet;
    });
}
//# sourceMappingURL=AST.js.map