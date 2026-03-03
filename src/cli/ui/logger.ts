import { success, warning, error as colorError, info, dim } from './colors.js';
import { SYMBOLS } from './colors.js';

export interface LoggerOptions {
  quiet?: boolean;
}

export interface Logger {
  info: (msg: string) => void;
  success: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  debug: (msg: string) => void;
  step: (msg: string) => void;
}

function getTimestamp(): string {
  return new Date().toISOString();
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const isQuiet = options.quiet ?? !process.stdout.isTTY;

  return {
    info(msg: string): void {
      if (!isQuiet) {
        process.stderr.write(`${dim(getTimestamp())} ${info('INFO')} ${msg}\n`);
      }
    },

    success(msg: string): void {
      if (!isQuiet) {
        process.stderr.write(`${dim(getTimestamp())} ${success(SYMBOLS.check)} ${msg}\n`);
      }
    },

    warn(msg: string): void {
      process.stderr.write(`${dim(getTimestamp())} ${warning(SYMBOLS.warning)} ${msg}\n`);
    },

    error(msg: string): void {
      process.stderr.write(`${dim(getTimestamp())} ${colorError(SYMBOLS.cross)} ${msg}\n`);
    },

    debug(msg: string): void {
      if (!isQuiet) {
        process.stderr.write(`${dim(getTimestamp())} ${dim('DEBUG')} ${dim(msg)}\n`);
      }
    },

    step(msg: string): void {
      if (!isQuiet) {
        process.stderr.write(`${dim(getTimestamp())} ${info(SYMBOLS.arrow)} ${msg}\n`);
      }
    },
  };
}
