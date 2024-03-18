/* eslint-disable no-lone-blocks */
import path from 'path'
import { parse } from '@babel/core'
import traverse from '@babel/traverse'
import { type PackageFeatureInfo } from './PackageFeatureInfo'
import { isMemberExpression } from '@babel/types'
import {
  base64_Pattern,
  getDomainPattern,
  IP_Pattern,
  SensitiveStringPattern,
  getDomainsType
} from './Patterns'
import { getFileLogger } from '../FileLogger'
import { type PositionRecorder, type Record } from './PositionRecorder'

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
  featureSet: PackageFeatureInfo,
  isInstallScript: boolean,
  targetJSFilePath: string,
  positionRecorder: PositionRecorder
): Promise<PackageFeatureInfo> {
  function getRecord(path, featureName) {
    return {
      filePath: targetJSFilePath,
      functionName: Math.random().toString(),
      featureName: featureName,
      content: path.node.loc
    } as Record
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
            featureSet.useBase64Conversion = true
            positionRecorder.addRecord(getRecord(path, 'useBase64Conversion'))
            if (isInstallScript) {
              featureSet.useBase64ConversionInScript = true
              positionRecorder.addRecord(getRecord(path, 'useBase64ConversionInScript'))
            }
          }
          if (
            path.node.arguments.length > 0 &&
            // @ts-expect-error uselesss lint error
            path.node.arguments[0].value === 'child_process'
          ) {
            featureSet.useProcess = true
            positionRecorder.addRecord(getRecord(path, 'useProcess'))
            if (isInstallScript) {
              featureSet.useProcessInScript = true
              positionRecorder.addRecord(getRecord(path, 'useProcessInScript'))
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
              featureSet.useFileSystem = true
              positionRecorder.addRecord(getRecord(path, 'useFileSystem'))
              if (isInstallScript) {
                featureSet.useFileSystemInScript = true
                positionRecorder.addRecord(getRecord(path, 'useFileSystemInScript'))
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
              featureSet.useNetwork = true
              positionRecorder.addRecord(getRecord(path, 'useNetwork'))
              if (isInstallScript) {
                featureSet.useNetworkInScript = true
                positionRecorder.addRecord(getRecord(path, 'useNetworkInScript'))
              }
            }
          }
          if (path.node.arguments.length > 0) {
            // @ts-expect-error uselesss lint error
            const moduleName = path.node.arguments[0].value as string
            if (moduleName === 'crypto' || moduleName === 'zlib') {
              featureSet.useEncryptAndEncode = true
              positionRecorder.addRecord(getRecord(path, 'useEncryptAndEncode'))
            }
          }
        }
        if (
          isMemberExpression(path.node.callee) &&
          // @ts-expect-error uselesss lint error
          path.node.callee.object.name === 'os'
        ) {
          featureSet.useOperatingSystem = true
          positionRecorder.addRecord(getRecord(path, 'useOperatingSystem'))
        }
      },
      StringLiteral: function (path) {
        const content = path.node.value
        if (content === 'base64') {
          featureSet.useBase64Conversion = true
          positionRecorder.addRecord(getRecord(path, 'useBase64Conversion'))
          if (isInstallScript) {
            featureSet.useBase64ConversionInScript = true
            positionRecorder.addRecord(getRecord(path, 'useBase64ConversionInScript'))
          }
        }
        if (content.length >= MAX_STRING_LENGTH) {
          return
        }
        {
          const matchResult = content.match(IP_Pattern)
          if (matchResult != null) {
            featureSet.includeIP = true
            positionRecorder.addRecord(getRecord(path, 'includeIP'))
          }
        }
        {
          const matchResult = content.match(base64_Pattern)
          if (matchResult != null) {
            featureSet.includeBase64String = true
            positionRecorder.addRecord(getRecord(path, 'includeBase64String'))
            if (isInstallScript) {
              featureSet.includeBase64StringInScript = true
              positionRecorder.addRecord(getRecord(path, 'includeBase64StringInScript'))
            }
          }
        }
        {
          const matchResult = content.match(getDomainPattern())
          if (matchResult != null) {
            const domainType = getDomainsType(matchResult)
            if (featureSet.includeDomain < domainType) {
              featureSet.includeDomain = domainType
            }
            for (const domain of matchResult) {
              positionRecorder.addRecord(getRecord(path, 'includeDomain'))
            }
            if (isInstallScript) {
              const domainType = getDomainsType(matchResult)
              if (featureSet.includeDomainInScript < domainType) {
                featureSet.includeDomainInScript = domainType
              }
              for (const domain of matchResult) {
                positionRecorder.addRecord(getRecord(path, 'includeDomainInScript'))
              }
            }
          }
        }
        {
          const matchResult = content.match(SensitiveStringPattern)
          if (matchResult != null) {
            featureSet.includeSensitiveFiles = true
            positionRecorder.addRecord(getRecord(path, 'includeSensitiveFiles'))
          }
        }
      },
      MemberExpression: function (path) {
        if (
          path.get('object').isIdentifier({ name: 'process' }) &&
          path.get('property').isIdentifier({ name: 'env' })
        ) {
          featureSet.useProcessEnv = true
          positionRecorder.addRecord(getRecord(path, 'useProcessEnv'))
          if (isInstallScript) {
            featureSet.useProcessEnvInScript = true
            positionRecorder.addRecord(getRecord(path, 'useProcessEnvInScript'))
          }
        }
        if (
          path.get('object').isIdentifier({ name: 'Buffer' }) &&
          path.get('property').isIdentifier({ name: 'from' })
        ) {
          featureSet.useBuffer = true
          positionRecorder.addRecord(getRecord(path, 'useBuffer'))
        }
      },
      NewExpression: function (path) {
        // @ts-expect-error uselesss lint error
        if (path.node.callee.name === 'Buffer') {
          featureSet.useBuffer = true
          positionRecorder.addRecord(getRecord(path, 'useBuffer'))
        }
      },
      ImportDeclaration: function (path) {
        const moduleName = path.node.source.value
        if (path.node.source.value === 'base64-js') {
          featureSet.useBase64Conversion = true
          positionRecorder.addRecord(getRecord(path, 'useBase64Conversion'))
          if (isInstallScript) {
            featureSet.useBase64ConversionInScript = true
            positionRecorder.addRecord(getRecord(path, 'useBase64ConversionInScript'))
          }
        }
        if (path.node.source.value === 'child_process') {
          featureSet.useProcess = true
          positionRecorder.addRecord(getRecord(path, 'useProcess'))
          if (isInstallScript) {
            featureSet.useProcessInScript = true
            positionRecorder.addRecord(getRecord(path, 'useProcessInScript'))
          }
        }
        {
          if (
            moduleName === 'fs' ||
            moduleName === 'fs/promises' ||
            moduleName === 'path' ||
            moduleName === 'promise-fs'
          ) {
            featureSet.useFileSystem = true
            positionRecorder.addRecord(getRecord(path, 'useFileSystem'))
            if (isInstallScript) {
              featureSet.useFileSystemInScript = true
              positionRecorder.addRecord(getRecord(path, 'useFileSystemInScript'))
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
            featureSet.useNetwork = true
            positionRecorder.addRecord(getRecord(path, 'useNetwork'))
            if (isInstallScript) {
              featureSet.useNetworkInScript = true
              positionRecorder.addRecord(getRecord(path, 'useNetworkInScript'))
            }
          }
        }
        {
          if (moduleName === 'crypto' || moduleName === 'zlib') {
            featureSet.useEncryptAndEncode = true
            positionRecorder.addRecord(getRecord(path, 'useEncryptAndEncode'))
          }
        }
      },
      Identifier: function (path) {
        if (path.node.name === 'eval') {
          featureSet.useEval = true
          positionRecorder.addRecord(getRecord(path, 'useEval'))
        } else if (path.node.name?.startsWith('_0x')) {
          featureSet.includeObfuscatedCode = true
          positionRecorder.addRecord(getRecord(path, 'includeObfuscatedCode'))
        }
      }
    })
  } catch (error) {
    await logger.log('Current analyzed file is ' + targetJSFilePath)
    const errorObj = error as Error
    await logger.log(`ERROR MESSAGE: ${errorObj.name}: ${errorObj.message}`)
    await logger.log('ERROR STACK:' + errorObj.stack)
  }

  return featureSet
}
