import chalk from 'chalk'
import * as fs from 'fs';
const logFilePath = '../../app.log'; // 定义日志文件的路径

function removeAnsiEscapeCodes(string) {
  return string.replace(/\x1B\[\d+m/g, '');
}

export const Logger = {
  info(message: string) {
    console.log(chalk.green(`${new Date().toLocaleString()}: ${message}\n`));
  },
  warning(message: string) {
    const formattedMessage = chalk.yellow(`${new Date().toLocaleString()}: ${message}\n`);
    console.log(formattedMessage);
    fs.appendFileSync(logFilePath, removeAnsiEscapeCodes(formattedMessage) + '\n'); 
  },
  error(message: string) {
    const formattedMessage = chalk.red(`${new Date().toLocaleString()}: ${message}\n`);
    console.log(formattedMessage);
    fs.appendFileSync(logFilePath, removeAnsiEscapeCodes(formattedMessage) + '\n'); 
  }
}

