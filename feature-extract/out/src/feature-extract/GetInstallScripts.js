var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable no-useless-catch */
import { parse } from '@babel/core';
import traverse from '@babel/traverse';
import { accessSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { isStringLiteral } from '@babel/types';
import { getFileLogger } from '../FileLogger';
/**
 * Get all JavaScript files that are executed or imported directly and indirectly in the install hook
 * @param jsFilesInInstallScript the path to js files in install script
 * @returns the parameter jsFilesInInstallScript
 */
export function getAllJSFilesInInstallScript(jsFilesInInstallScript) {
    return __awaiter(this, void 0, void 0, function* () {
        function resolveAllJSFilesInInstallScript(jsFilesInInstallScript, idx) {
            return __awaiter(this, void 0, void 0, function* () {
                if (idx >= jsFilesInInstallScript.length) {
                    return;
                }
                const logger = yield getFileLogger();
                const codeContent = readFileSync(jsFilesInInstallScript[idx], {
                    encoding: 'utf-8'
                });
                let ast;
                try {
                    ast = parse(codeContent, {
                        sourceType: 'unambiguous'
                    });
                }
                catch (error) {
                    yield logger.log('Current analyzed file is ' + jsFilesInInstallScript[idx]);
                    const errorObj = error;
                    yield logger.log(`ERROR MESSAGE: ${errorObj.name}: ${errorObj.message}`);
                    yield logger.log('ERROR STACK:' + errorObj.stack);
                }
                try {
                    traverse(ast, {
                        CallExpression: function (path) {
                            // @ts-expect-error uselesss lint error
                            if (path.node.callee.name === 'require') {
                                if (path.node.arguments.length > 0) {
                                    if (isStringLiteral(path.node.arguments[0])) {
                                        const moduleName = path.node.arguments[0].value;
                                        try {
                                            if (moduleName.startsWith('/') || moduleName.startsWith('./') || moduleName.startsWith('../')) {
                                                let importScript = join(dirname(jsFilesInInstallScript[idx]), moduleName);
                                                if (importScript.endsWith('.js') || !importScript.includes('.')) {
                                                    if (!importScript.endsWith('.js')) {
                                                        importScript = importScript + '.js';
                                                    }
                                                    try {
                                                        accessSync(importScript);
                                                        jsFilesInInstallScript.push(importScript);
                                                    }
                                                    catch (error) {
                                                        console.log(error);
                                                    }
                                                }
                                            }
                                        }
                                        catch (error) {
                                            throw error;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
                catch (error) {
                    yield logger.log('Current analyzed file is ' + jsFilesInInstallScript[idx]);
                    const errorObj = error;
                    yield logger.log(`ERROR MESSAGE: ${errorObj.name}: ${errorObj.message}`);
                    yield logger.log('ERROR STACK:' + errorObj.stack);
                }
                yield resolveAllJSFilesInInstallScript(jsFilesInInstallScript, idx + 1);
            });
        }
        yield resolveAllJSFilesInInstallScript(jsFilesInInstallScript, 0);
    });
}
//# sourceMappingURL=GetInstallScripts.js.map