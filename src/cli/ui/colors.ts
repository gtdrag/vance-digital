import pc from 'picocolors';

export const success = (text: string): string => pc.green(text);
export const warning = (text: string): string => pc.yellow(text);
export const error = (text: string): string => pc.red(text);
export const info = (text: string): string => pc.cyan(text);
export const dim = (text: string): string => pc.dim(text);
export const bold = (text: string): string => pc.bold(text);
export const label = (text: string): string => pc.blue(text);

export const SYMBOLS = {
  check: '✓',
  cross: '✗',
  warning: '⚠',
  arrow: '→',
  bullet: '●',
} as const;
