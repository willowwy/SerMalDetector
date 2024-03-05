import { byteString_Pattern } from './Patterns';
export function matchUseRegExp(code, result, positionRecorder, targetJSFilePath) {
    const matchResult = code.match(byteString_Pattern);
    if (matchResult != null) {
        result.includeByteString = true;
        positionRecorder.addRecord('includeByteString', {
            filePath: targetJSFilePath,
            content: matchResult[1]
        });
    }
}
//# sourceMappingURL=RegExp.js.map