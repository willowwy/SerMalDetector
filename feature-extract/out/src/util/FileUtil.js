var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { readFile } from 'fs/promises';
/**
 * Determine whether the file is UTF-8 with BOM encoded
 * @param filePath the path to file to be determined
 * @returns whether the file is UTF-8 with BOM encoded
 */
export function isUTF8WithBOM(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const buffer = yield readFile(filePath);
        return buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
    });
}
/**
 * Read UTF-8 with BOM encoded files as UTF-8 encoded contents
 * @param filePath the path to be UTF-8 with BOM encoded file
 */
export function readFileFromUTF8WithBOM(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileContent = yield readFile(filePath, { encoding: 'utf8' });
        const utf8Content = fileContent.replace(/^\uFEFF/, '');
        return utf8Content;
    });
}
//# sourceMappingURL=FileUtil.js.map