import { type PackageFeatureInfo } from './PackageFeatureInfo';

export interface Record {
  filePath: string;
  functionName: string;
  featureName: string;
  content: {
    start: {
      line: number;
      column: number;
    };
    end: {
      line: number;
      column: number;
    };
  } | string;
}

export class PositionRecorder {
  featurePosSet: Array<{
    filePath: string;
    functions: Array<{
      functionName: string;
      features: Array<{
        featureName: string;
        content: {
          start: { line: number; column: number; index?: number };
          end: { line: number; column: number; index?: number };
        } | string;
      }>;
    }>;
  }> = [];

  addRecord(record: Record) {
    // Find or create the file object
    let fileObj = this.featurePosSet.find(f => f.filePath === record.filePath);
    if (!fileObj) {
      fileObj = { filePath: record.filePath, functions: [] };
      this.featurePosSet.push(fileObj);
    }

    // Find or create the function object within the file
    let funcObj = fileObj.functions.find(f => f.functionName === record.functionName);
    if (!funcObj) {
      funcObj = { functionName: record.functionName, features: [] };
      fileObj.functions.push(funcObj);
    }

    // Add the feature to the function
    funcObj.features.push({
      featureName: record.featureName,
      content: record.content
    });
  }

  serializeRecord() {
    // Serialize the featurePosSet with pretty print
    return JSON.stringify(this.featurePosSet, null, 2);
  }
}