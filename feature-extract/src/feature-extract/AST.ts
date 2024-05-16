/* eslint-disable no-lone-blocks */
import path from "path";
import { parse } from "@babel/core";
import traverse from "@babel/traverse";
import { Logger } from "../Logger";
import { isMemberExpression } from "@babel/types";
import {
  base64_Pattern,
  getDomainPattern,
  IP_Pattern,
  SensitiveStringPattern,
  getDomainsType,
  byteString_Pattern,
} from "./Patterns";
import { getFileLogger } from "../FileLogger";
import { type PositionRecorder, type Record } from "./PositionRecorder";
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
export async function extractFeaturesFromJSFileByAST(
  code: string,
  isInstallScript: boolean,
  targetJSFilePath: string,
  positionRecorder: PositionRecorder,
  CallGraphFiles: string[],
  CallGraphFunctions: { [key: string]: string },
  actualPackagePath: string,
  ifCallGraphGenerated: number
): Promise<void> {
  function getRecord(path: any, featureName: string) {
    return {
      filePath: targetJSFilePath,
      functionName: getFuncNum(path, targetJSFilePath),
      featureName: featureName,
      content: path.node.loc,
    } as Record;
  }

  /**
   * Gets the function number from the call graph for a given node path and file path.
   *
   * @param nodePath The path to the node.
   * @param filePath The file path to the JavaScript file containing the node.
   * @returns The function number if found, otherwise returns null.
   */
  function getFuncNum(nodePath: any, filePath: string): string | null {
    if (ifCallGraphGenerated === -1) {
      return "-1";
    }

    const relativePath = path.relative(actualPackagePath, filePath);
    const fileIndex = CallGraphFiles.findIndex(
      (PathinGraph) =>
        path.normalize(PathinGraph) === path.normalize(relativePath)
    );

    if (fileIndex === -1) {
      // Logger.error(filePath + 'not found in CallGraph JSON data.');
      return null;
    }

    const startLine = nodePath.node.loc.start.line;
    const startColumn = nodePath.node.loc.start.column + 1;
    const endLine = nodePath.node.loc.end.line;
    const endColumn = nodePath.node.loc.end.column + 1;

    for (const [funcNum, loc] of Object.entries(CallGraphFunctions)) {
      const [fIndex, sLine, sColumn, eLine, eColumn] = loc
        .split(":")
        .map(Number);
      const isSameFile = fIndex === fileIndex;
      const isWithinLineRange =
        startLine > sLine || (startLine === sLine && startColumn >= sColumn);
      const isWithinEndLineRange =
        endLine < eLine || (endLine === eLine && endColumn <= eColumn);
      if (isSameFile && isWithinLineRange && isWithinEndLineRange) {
        return funcNum;
      }
    }
    // Logger.error('Function not found in CallGraph JSON data in' + filePath);
    return null;
  }

  const logger = await getFileLogger();
  let ast: any;
  try {
    ast = parse(code, {
      sourceType: "unambiguous",
    });
  } catch (error) {
    await logger.log("Current analyzed file is " + targetJSFilePath);
    const errorObj = error as Error;
    await logger.log(`ERROR MESSAGE: ${errorObj.name}: ${errorObj.message}`);
    await logger.log("ERROR STACK:" + errorObj.stack);
  }
  try {
    traverse(ast, {
      CallExpression: function (path) {
        // @ts-expect-error uselesss lint error
        if (path.node.callee.name === "require") {
          if (
            path.node.arguments.length > 0 &&
            // @ts-expect-error uselesss lint error
            path.node.arguments[0].value === "base64-js"
          ) {
            // featureSet.useBase64Conversion = true
            positionRecorder.addRecord(getRecord(path, "useBase64Conversion"));
            if (isInstallScript) {
              // featureSet.useBase64ConversionInScript = true
              positionRecorder.addRecord(
                getRecord(path, "useBase64ConversionInScript")
              );
            }
          }
          if (
            path.node.arguments.length > 0 &&
            // @ts-expect-error uselesss lint error
            path.node.arguments[0].value === "child_process"
          ) {
            // featureSet.useProcess = true
            positionRecorder.addRecord(getRecord(path, "useProcess"));
            if (isInstallScript) {
              // featureSet.useProcessInScript = true
              positionRecorder.addRecord(getRecord(path, "useProcessInScript"));
            }
          }
          if (path.node.arguments.length > 0) {
            // @ts-expect-error uselesss lint error
            const importModuleName = path.node.arguments[0].value;
            if (
              importModuleName === "fs" ||
              importModuleName === "fs/promises" ||
              importModuleName === "path" ||
              importModuleName === "promise-fs"
            ) {
              // featureSet.useFileSystem = true
              positionRecorder.addRecord(getRecord(path, "useFileSystem"));
              if (isInstallScript) {
                // featureSet.useFileSystemInScript = true
                positionRecorder.addRecord(
                  getRecord(path, "useFileSystemInScript")
                );
              }
            }
          }

          if (path.node.arguments.length > 0) {
            // @ts-expect-error uselesss lint error
            const moduleName = path.node.arguments[0].value as string;
            if (
              moduleName === "http" ||
              moduleName === "https" ||
              moduleName === "nodemailer" ||
              moduleName === "axios" ||
              moduleName === "request" ||
              moduleName === "node-fetch" ||
              moduleName === "got" ||
              moduleName === "dns"
            ) {
              positionRecorder.addRecord(getRecord(path, "useNetwork"));
              if (isInstallScript) {
                positionRecorder.addRecord(
                  getRecord(path, "useNetworkInScript")
                );
              }
            }
          }
          if (path.node.arguments.length > 0) {
            // @ts-expect-error uselesss lint error
            const moduleName = path.node.arguments[0].value as string;
            if (moduleName === "crypto" || moduleName === "zlib") {
              positionRecorder.addRecord(
                getRecord(path, "useEncryptAndEncode")
              );
            }
          }
        }
        if (
          isMemberExpression(path.node.callee) &&
          // @ts-expect-error uselesss lint error
          path.node.callee.object.name === "os"
        ) {
          positionRecorder.addRecord(getRecord(path, "useOperatingSystem"));
        }
      },
      StringLiteral: function (path) {
        const content = path.node.value;
        if (content === "base64") {
          positionRecorder.addRecord(getRecord(path, "useBase64Conversion"));
          if (isInstallScript) {
            positionRecorder.addRecord(
              getRecord(path, "useBase64ConversionInScript")
            );
          }
        }
        if (content.length >= MAX_STRING_LENGTH) {
          return;
        }
        {
          const matchResult = content.match(IP_Pattern);
          if (matchResult != null) {
            // featureSet.includeIP = true
            positionRecorder.addRecord(getRecord(path, "includeIP"));
          }
        }
        {
          const matchResult = content.match(base64_Pattern);
          if (matchResult != null) {
            // featureSet.includeBase64String = true
            // positionRecorder.addRecord(getRecord(path, 'includeBase64String' ))
            if (isInstallScript) {
              // featureSet.includeBase64StringInScript = true
              // positionRecorder.addRecord(getRecord(path, 'includeBase64StringInScript' ))
            }
          }
        }
        {
          const matchResult = content.match(getDomainPattern());
          if (matchResult != null) {
            const domainType = getDomainsType(matchResult);
            // if (featureSet.includeDomain < domainType) {
            //   featureSet.includeDomain = domainType
            // }
            for (const domain of matchResult) {
              positionRecorder.addRecord(getRecord(path, "includeDomain"));
            }
            if (isInstallScript) {
              const domainType = getDomainsType(matchResult);
              // if (featureSet.includeDomainInScript < domainType) {
              //   featureSet.includeDomainInScript = domainType
              // }
              for (const domain of matchResult) {
                positionRecorder.addRecord(
                  getRecord(path, "includeDomainInScript")
                );
              }
            }
          }
        }
        {
          const matchResult = content.match(SensitiveStringPattern);
          if (matchResult != null) {
            // featureSet.includeSensitiveFiles = true
            positionRecorder.addRecord(
              getRecord(path, "includeSensitiveFiles")
            );
          }
        }
        {
          const matchResult = code.match(byteString_Pattern);
          if (matchResult != null) {
            // featureSet.includeByteString = true
            positionRecorder.addRecord(getRecord(path, "includeByteString"));
            // positionRecorder.addRecord({
            //   filePath: targetJSFilePath,
            //   functionName: getFuncNum(path , targetJSFilePath),
            //   featureName: 'includeByteString',
            //   content: matchResult[1]
            // })
          }
        }
      },
      MemberExpression: function (path) {
        if (
          path.get("object").isIdentifier({ name: "process" }) &&
          path.get("property").isIdentifier({ name: "env" })
        ) {
          // featureSet.useProcessEnv = true
          positionRecorder.addRecord(getRecord(path, "useProcessEnv"));
          if (isInstallScript) {
            // featureSet.useProcessEnvInScript = true
            positionRecorder.addRecord(
              getRecord(path, "useProcessEnvInScript")
            );
          }
        }
        if (
          path.get("object").isIdentifier({ name: "Buffer" }) &&
          path.get("property").isIdentifier({ name: "from" })
        ) {
          // featureSet.useBuffer = true
          positionRecorder.addRecord(getRecord(path, "useBuffer"));
        }
      },
      NewExpression: function (path) {
        // @ts-expect-error uselesss lint error
        if (path.node.callee.name === "Buffer") {
          // featureSet.useBuffer = true
          positionRecorder.addRecord(getRecord(path, "useBuffer"));
        }
      },
      ImportDeclaration: function (path) {
        const moduleName = path.node.source.value;
        if (path.node.source.value === "base64-js") {
          // featureSet.useBase64Conversion = true
          positionRecorder.addRecord(getRecord(path, "useBase64Conversion"));
          if (isInstallScript) {
            // featureSet.useBase64ConversionInScript = true
            positionRecorder.addRecord(
              getRecord(path, "useBase64ConversionInScript")
            );
          }
        }
        if (path.node.source.value === "child_process") {
          // featureSet.useProcess = true
          positionRecorder.addRecord(getRecord(path, "useProcess"));
          if (isInstallScript) {
            // featureSet.useProcessInScript = true
            positionRecorder.addRecord(getRecord(path, "useProcessInScript"));
          }
        }
        {
          if (
            moduleName === "fs" ||
            moduleName === "fs/promises" ||
            moduleName === "path" ||
            moduleName === "promise-fs"
          ) {
            // featureSet.useFileSystem = true
            positionRecorder.addRecord(getRecord(path, "useFileSystem"));
            if (isInstallScript) {
              // featureSet.useFileSystemInScript = true
              positionRecorder.addRecord(
                getRecord(path, "useFileSystemInScript")
              );
            }
          }
        }
        {
          if (
            moduleName === "http" ||
            moduleName === "https" ||
            moduleName === "nodemailer" ||
            moduleName === "aixos" ||
            moduleName === "request" ||
            moduleName === "node-fetch" ||
            moduleName === "got" ||
            moduleName === "dns"
          ) {
            // featureSet.useNetwork = true
            positionRecorder.addRecord(getRecord(path, "useNetwork"));
            if (isInstallScript) {
              // featureSet.useNetworkInScript = true
              positionRecorder.addRecord(getRecord(path, "useNetworkInScript"));
            }
          }
        }
        {
          if (moduleName === "crypto" || moduleName === "zlib") {
            // featureSet.useEncryptAndEncode = true
            positionRecorder.addRecord(getRecord(path, "useEncryptAndEncode"));
          }
        }
      },
      Identifier: function (path) {
        if (path.node.name === "eval") {
          // featureSet.useEval = true
          positionRecorder.addRecord(getRecord(path, "useEval"));
        } else if (path.node.name?.startsWith("_0x")) {
          // featureSet.includeObfuscatedCode = true
          positionRecorder.addRecord(getRecord(path, "includeObfuscatedCode"));
        }
      },
    });
  } catch (error) {
    await logger.log("Current analyzed file is " + targetJSFilePath);
    const errorObj = error as Error;
    await logger.log(`ERROR MESSAGE: ${errorObj.name}: ${errorObj.message}`);
    await logger.log("ERROR STACK:" + errorObj.stack);
  }

  // return featureSet
  return;
}
