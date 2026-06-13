import fs from 'fs';
import path from 'path';

export class Logger {
  private static logFilePath: string | null = null;

  private static getLogFile(): string {
    if (this.logFilePath) return this.logFilePath;

    // Store logs inside the temporary/logs workspace directory
    const logDir = path.resolve(process.cwd(), 'temporary', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    this.logFilePath = path.join(logDir, 'lms-application.log');
    return this.logFilePath;
  }

  private static writeToFile(level: string, message: string, meta?: any) {
    try {
      const logFile = this.getLogFile();
      const timestamp = new Date().toISOString();
      const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
      const entry = `[${timestamp}] [${level}] ${message}${metaStr}\n`;
      fs.appendFileSync(logFile, entry, 'utf8');
    } catch (e) {
      // Ignore logger disk write failures to prevent breaking request lifecycle
    }
  }

  static info(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[32m[INFO]\x1b[0m [${timestamp}] ${message}`, meta ? meta : '');
    this.writeToFile('INFO', message, meta);
  }

  static warn(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    console.warn(`\x1b[33m[WARN]\x1b[0m [${timestamp}] ${message}`, meta ? meta : '');
    this.writeToFile('WARN', message, meta);
  }

  static error(message: string, error?: any, meta?: any) {
    const timestamp = new Date().toISOString();
    const errDetails = error
      ? error.stack || error.message || JSON.stringify(error)
      : '';
    console.error(
      `\x1b[31m[ERROR]\x1b[0m [${timestamp}] ${message}`,
      errDetails,
      meta ? meta : ''
    );
    this.writeToFile('ERROR', `${message} | Error: ${errDetails}`, meta);
  }
}

export default Logger;
