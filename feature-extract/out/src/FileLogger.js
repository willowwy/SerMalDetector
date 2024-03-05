var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { open, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { getRootDirectory } from './util';
export class FileLogger {
    init(logFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield mkdir(dirname(logFilePath), { recursive: true });
            }
            catch (e) {
            }
            this.fileHandler = yield open(logFilePath, 'w+');
            return this;
        });
    }
    log(message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fileHandler.writeFile(message + ' ' + new Date().toLocaleString() + '\n');
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fileHandler.close();
        });
    }
}
let logger;
export function getFileLogger() {
    return __awaiter(this, void 0, void 0, function* () {
        if (logger != null) {
            return logger;
        }
        logger = new FileLogger();
        const logPath = join(getRootDirectory(), 'log', 'error.log');
        yield logger.init(logPath);
        return logger;
    });
}
//# sourceMappingURL=FileLogger.js.map