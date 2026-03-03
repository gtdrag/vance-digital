import Table from 'cli-table3';
import { info, label } from './colors.js';

export interface TableOptions {
  head?: string[];
  colWidths?: number[];
}

export function createTable(head: string[], options?: TableOptions): Table.Table {
  return new Table({
    head: head.map((h) => info(h)),
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
    style: {
      head: [],
      border: [],
    },
    colWidths: options?.colWidths,
  });
}

export function keyValueTable(data: Record<string, string | number>): Table.Table {
  const table = new Table({
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
    style: {
      head: [],
      border: [],
    },
  });

  for (const [key, value] of Object.entries(data)) {
    table.push([label(key), String(value)]);
  }

  return table;
}
