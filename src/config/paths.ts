import { xdgConfig, xdgData } from 'xdg-basedir';
import os from 'os';
import path from 'path';

export function getConfigDir(): string {
  return path.join(
    xdgConfig ?? path.join(os.homedir(), '.config'),
    'domainweave'
  );
}

export function getDataDir(): string {
  return path.join(
    xdgData ?? path.join(os.homedir(), '.local', 'share'),
    'domainweave'
  );
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export function getDbPath(): string {
  return path.join(getDataDir(), 'state.db');
}
