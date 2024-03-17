import { type PackageFeatureInfo } from './PackageFeatureInfo'
import { byteString_Pattern } from './Patterns'
import { type PositionRecorder } from './PositionRecorder'

export function matchUseRegExp (code: string, result: PackageFeatureInfo, positionRecorder: PositionRecorder, targetJSFilePath: string) {
  const matchResult = code.match(byteString_Pattern)
  if (matchResult != null) {
    result.includeByteString = true
    positionRecorder.addRecord({
      filePath: targetJSFilePath,
      functionName: 'N/A',
      featureName: 'includeByteString',
      content: matchResult[1]
    })
  }
}
