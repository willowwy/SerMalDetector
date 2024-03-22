/* eslint-disable no-lone-blocks */
import path from 'path'
import fs from 'fs'
import { parse } from '@babel/core'
import traverse from '@babel/traverse'
// import { type PackageFeatureInfo } from './PackageFeatureInfo'
import { isMemberExpression } from '@babel/types'
import {
  base64_Pattern,
  getDomainPattern,
  IP_Pattern,
  SensitiveStringPattern,
  getDomainsType,
  byteString_Pattern
} from './Patterns'
import { getFileLogger } from '../FileLogger'
import { type PositionRecorder, type Record } from './PositionRecorder'
import { get } from 'http'
import { resourceLimits } from 'worker_threads'
import { CallGraph } from '../call-graph/generateCallGraph'

const MAX_STRING_LENGTH = 66875


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
  // featureSet: PackageFeatureInfo,
  isInstallScript: boolean,
  targetJSFilePath: string,
  positionRecorder: PositionRecorder,
  CallGraphData: CallGraph
): Promise<void> {
  function getRecord(path: any, featureName: string, CallGraphData: CallGraph) {
    return {
      filePath: targetJSFilePath,
      functionName: getFuncNum(path, CallGraphData, targetJSFilePath),
      featureName: featureName,
      content: path.node.loc
    } as Record
  }

  function getFuncNum(nodePath: any, jsonData: CallGraph, filePath: string): string | null {
    const pathAfterPackage = filePath.split('/package/')[1] || 'Path does not contain "/package/".';
    const fileIndex = jsonData.files.findIndex(PathinGraph => path.normalize(PathinGraph) === path.normalize(pathAfterPackage));

    if (fileIndex === -1) {
      // console.error('File not found in JSON data.');
      return null; // 如果找不到文件，返回null
    }

    const startLine = nodePath.node.loc.start.line;
    const startColumn = nodePath.node.loc.start.column;
    const endLine = nodePath.node.loc.end.line;
    const endColumn = nodePath.node.loc.end.column;


    for (const [funcNum, loc] of Object.entries(jsonData.functions)) {
      const [fIndex, sLine, sColumn, eLine, eColumn] = loc.split(':').map(Number);
      const isSameFile = fIndex === fileIndex;
      const isWithinLineRange = startLine > sLine || (startLine === sLine && startColumn >= sColumn);
      const isWithinEndLineRange = endLine < eLine || (endLine === eLine && endColumn <= eColumn);
      if (isSameFile && isWithinLineRange && isWithinEndLineRange) {
        return funcNum;
      }
    }
    console.error('Function not found in JSON data.');
    return null;
  }



  const logger = await getFileLogger()
  let ast: any
  try {
    ast = parse(code, {
      sourceType: 'unambiguous'
    })
  } catch (error) {
    await logger.log('Current analyzed file is ' + targetJSFilePath)
    const errorObj = error as Error
    await logger.log(`ERROR MESSAGE: ${errorObj.name}: ${errorObj.message}`)
    await logger.log('ERROR STACK:' + errorObj.stack)
  }
  try {
    traverse(ast, {
      CallExpression: function (path) {
        // @ts-expect-error uselesss lint error
        if (path.node.callee.name === 'require') {
          if (
            path.node.arguments.length > 0 &&
            // @ts-expect-error uselesss lint error
            path.node.arguments[0].value === 'base64-js'
          ) {
            // featureSet.useBase64Conversion = true
            positionRecorder.addRecord(getRecord(path, 'useBase64Conversion', CallGraphData))
            if (isInstallScript) {
              // featureSet.useBase64ConversionInScript = true
              positionRecorder.addRecord(getRecord(path, 'useBase64ConversionInScript', CallGraphData))
            }
          }
          if (
            path.node.arguments.length > 0 &&
            // @ts-expect-error uselesss lint error
            path.node.arguments[0].value === 'child_process'
          ) {
            // featureSet.useProcess = true
            positionRecorder.addRecord(getRecord(path, 'useProcess', CallGraphData))
            if (isInstallScript) {
              // featureSet.useProcessInScript = true
              positionRecorder.addRecord(getRecord(path, 'useProcessInScript', CallGraphData))
            }
          }
          if (path.node.arguments.length > 0) {
            // @ts-expect-error uselesss lint error
            const importModuleName = path.node.arguments[0].value
            if (
              importModuleName === 'fs' ||
              importModuleName === 'fs/promises' ||
              importModuleName === 'path' ||
              importModuleName === 'promise-fs'
            ) {
              // featureSet.useFileSystem = true
              positionRecorder.addRecord(getRecord(path, 'useFileSystem', CallGraphData))
              if (isInstallScript) {
                // featureSet.useFileSystemInScript = true
                positionRecorder.addRecord(getRecord(path, 'useFileSystemInScript', CallGraphData))
              }
            }
          }

          if (path.node.arguments.length > 0) {
            // @ts-expect-error uselesss lint error
            const moduleName = path.node.arguments[0].value as string
            if (
              moduleName === 'http' ||
              moduleName === 'https' ||
              moduleName === 'nodemailer' ||
              moduleName === 'axios' ||
              moduleName === 'request' ||
              moduleName === 'node-fetch' ||
              moduleName === 'got' ||
              moduleName === 'dns'
            ) {
              // featureSet.useNetwork = true
              positionRecorder.addRecord(getRecord(path, 'useNetwork', CallGraphData))
              if (isInstallScript) {
                // featureSet.useNetworkInScript = true
                positionRecorder.addRecord(getRecord(path, 'useNetworkInScript', CallGraphData))
              }
            }
          }
          if (path.node.arguments.length > 0) {
            // @ts-expect-error uselesss lint error
            const moduleName = path.node.arguments[0].value as string
            if (moduleName === 'crypto' || moduleName === 'zlib') {
              // featureSet.useEncryptAndEncode = true
              positionRecorder.addRecord(getRecord(path, 'useEncryptAndEncode', CallGraphData))
            }
          }
        }
        if (
          isMemberExpression(path.node.callee) &&
          // @ts-expect-error uselesss lint error
          path.node.callee.object.name === 'os'
        ) {
          // featureSet.useOperatingSystem = true
          positionRecorder.addRecord(getRecord(path, 'useOperatingSystem', CallGraphData))
        }
      },
      StringLiteral: function (path) {
        const content = path.node.value
        if (content === 'base64') {
          // featureSet.useBase64Conversion = true
          positionRecorder.addRecord(getRecord(path, 'useBase64Conversion', CallGraphData))
          if (isInstallScript) {
            // featureSet.useBase64ConversionInScript = true
            positionRecorder.addRecord(getRecord(path, 'useBase64ConversionInScript', CallGraphData))
          }
        }
        if (content.length >= MAX_STRING_LENGTH) {
          return
        }
        {
          const matchResult = content.match(IP_Pattern)
          if (matchResult != null) {
            // featureSet.includeIP = true
            positionRecorder.addRecord(getRecord(path, 'includeIP', CallGraphData))
          }
        }
        {
          const matchResult = content.match(base64_Pattern)
          if (matchResult != null) {
            // featureSet.includeBase64String = true
            // positionRecorder.addRecord(getRecord(path, 'includeBase64String', CallGraphData))
            if (isInstallScript) {
              // featureSet.includeBase64StringInScript = true
              // positionRecorder.addRecord(getRecord(path, 'includeBase64StringInScript', CallGraphData))
            }
          }
        }
        {
          const matchResult = content.match(getDomainPattern())
          if (matchResult != null) {
            const domainType = getDomainsType(matchResult)
            // if (featureSet.includeDomain < domainType) {
            //   featureSet.includeDomain = domainType
            // }
            for (const domain of matchResult) {
              positionRecorder.addRecord(getRecord(path, 'includeDomain', CallGraphData))
            }
            if (isInstallScript) {
              const domainType = getDomainsType(matchResult)
              // if (featureSet.includeDomainInScript < domainType) {
              //   featureSet.includeDomainInScript = domainType
              // }
              for (const domain of matchResult) {
                positionRecorder.addRecord(getRecord(path, 'includeDomainInScript', CallGraphData))
              }
            }
          }
        }
        {
          const matchResult = content.match(SensitiveStringPattern)
          if (matchResult != null) {
            // featureSet.includeSensitiveFiles = true
            positionRecorder.addRecord(getRecord(path, 'includeSensitiveFiles', CallGraphData))
          }
        }
        {
          const matchResult = code.match(byteString_Pattern)
          if (matchResult != null) {
            // featureSet.includeByteString = true
            positionRecorder.addRecord(getRecord(path, 'includeByteString', CallGraphData))
            // positionRecorder.addRecord({
            //   filePath: targetJSFilePath,
            //   functionName: getFuncNum(path, CallGraphData, targetJSFilePath),
            //   featureName: 'includeByteString',
            //   content: matchResult[1]
            // })
          }
        }
      },
      MemberExpression: function (path) {
        if (
          path.get('object').isIdentifier({ name: 'process' }) &&
          path.get('property').isIdentifier({ name: 'env' })
        ) {
          // featureSet.useProcessEnv = true
          positionRecorder.addRecord(getRecord(path, 'useProcessEnv', CallGraphData))
          if (isInstallScript) {
            // featureSet.useProcessEnvInScript = true
            positionRecorder.addRecord(getRecord(path, 'useProcessEnvInScript', CallGraphData))
          }
        }
        if (
          path.get('object').isIdentifier({ name: 'Buffer' }) &&
          path.get('property').isIdentifier({ name: 'from' })
        ) {
          // featureSet.useBuffer = true
          positionRecorder.addRecord(getRecord(path, 'useBuffer', CallGraphData))
        }
      },
      NewExpression: function (path) {
        // @ts-expect-error uselesss lint error
        if (path.node.callee.name === 'Buffer') {
          // featureSet.useBuffer = true
          positionRecorder.addRecord(getRecord(path, 'useBuffer', CallGraphData))
        }
      },
      ImportDeclaration: function (path) {
        const moduleName = path.node.source.value
        if (path.node.source.value === 'base64-js') {
          // featureSet.useBase64Conversion = true
          positionRecorder.addRecord(getRecord(path, 'useBase64Conversion', CallGraphData))
          if (isInstallScript) {
            // featureSet.useBase64ConversionInScript = true
            positionRecorder.addRecord(getRecord(path, 'useBase64ConversionInScript', CallGraphData))
          }
        }
        if (path.node.source.value === 'child_process') {
          // featureSet.useProcess = true
          positionRecorder.addRecord(getRecord(path, 'useProcess', CallGraphData))
          if (isInstallScript) {
            // featureSet.useProcessInScript = true
            positionRecorder.addRecord(getRecord(path, 'useProcessInScript', CallGraphData))
          }
        }
        {
          if (
            moduleName === 'fs' ||
            moduleName === 'fs/promises' ||
            moduleName === 'path' ||
            moduleName === 'promise-fs'
          ) {
            // featureSet.useFileSystem = true
            positionRecorder.addRecord(getRecord(path, 'useFileSystem', CallGraphData))
            if (isInstallScript) {
              // featureSet.useFileSystemInScript = true
              positionRecorder.addRecord(getRecord(path, 'useFileSystemInScript', CallGraphData))
            }
          }
        }
        {
          if (
            moduleName === 'http' ||
            moduleName === 'https' ||
            moduleName === 'nodemailer' ||
            moduleName === 'aixos' ||
            moduleName === 'request' ||
            moduleName === 'node-fetch' ||
            moduleName === 'got' ||
            moduleName === 'dns'
          ) {
            // featureSet.useNetwork = true
            positionRecorder.addRecord(getRecord(path, 'useNetwork', CallGraphData))
            if (isInstallScript) {
              // featureSet.useNetworkInScript = true
              positionRecorder.addRecord(getRecord(path, 'useNetworkInScript', CallGraphData))
            }
          }
        }
        {
          if (moduleName === 'crypto' || moduleName === 'zlib') {
            // featureSet.useEncryptAndEncode = true
            positionRecorder.addRecord(getRecord(path, 'useEncryptAndEncode', CallGraphData))
          }
        }
      },
      Identifier: function (path) {
        if (path.node.name === 'eval') {
          // featureSet.useEval = true
          positionRecorder.addRecord(getRecord(path, 'useEval', CallGraphData))
        } else if (path.node.name?.startsWith('_0x')) {
          // featureSet.includeObfuscatedCode = true
          positionRecorder.addRecord(getRecord(path, 'includeObfuscatedCode', CallGraphData))
        }
      }
    })
  } catch (error) {
    await logger.log('Current analyzed file is ' + targetJSFilePath)
    const errorObj = error as Error
    await logger.log(`ERROR MESSAGE: ${errorObj.name}: ${errorObj.message}`)
    await logger.log('ERROR STACK:' + errorObj.stack)
  }

  // return featureSet
  return
}
