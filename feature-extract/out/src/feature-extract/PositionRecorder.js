const MAX_RECORD_NUMBER = 1000;
export class PositionRecorder {
    constructor() {
        this.featurePosSet = {
            includeInstallScript: [],
            includeIP: [],
            useBase64Conversion: [],
            useBase64ConversionInScript: [],
            includeDomain: [],
            includeDomainInScript: [],
            includeByteString: [],
            useBuffer: [],
            useEval: [],
            useProcess: [],
            useProcessInScript: [],
            useFileSystem: [],
            useFileSystemInScript: [],
            useNetwork: [],
            useNetworkInScript: [],
            useProcessEnv: [],
            useProcessEnvInScript: [],
            useEncryptAndEncode: [],
            useOperatingSystem: [],
            includeSensitiveFiles: []
        };
    }
    addRecord(key, record) {
        if (this.featurePosSet[key].length > MAX_RECORD_NUMBER) {
            return;
        }
        this.featurePosSet[key].push(record);
    }
    serializeRecord() {
        return JSON.stringify(this.featurePosSet);
    }
}
//# sourceMappingURL=PositionRecorder.js.map