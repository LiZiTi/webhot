import { inspect } from 'node:util';

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const WHITE = '\x1b[97m';

type PanelRow = {
  label: string;
  value: unknown;
};

function colorize(color: string, text: string): string {
  return `${color}${text}${RESET}`;
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

function formatScope(scope: string): string {
  return colorize(CYAN, `[${scope}]`);
}

function formatMessage(message: string): string {
  return message.split('\n').map((line, i) => i === 0 ? line : `  ${line}`).join('\n');
}

function formatDetail(detail: unknown): string {
  if (detail === undefined || detail === null || detail === '') return '';
  if (typeof detail === 'string') return detail;
  return inspect(detail, {
    depth: 4,
    colors: process.stdout.isTTY,
    compact: false,
    sorted: true,
  });
}

function formatInline(detail: unknown): string {
  if (detail === undefined || detail === null || detail === '') return '';
  if (typeof detail === 'string') return detail.replace(/\s+/g, ' ').trim();
  if (typeof detail === 'number' || typeof detail === 'bigint' || typeof detail === 'boolean') {
    return String(detail);
  }

  return inspect(detail, {
    depth: 1,
    colors: false,
    compact: true,
    breakLength: 80,
    sorted: true,
  }).replace(/\s+/g, ' ').trim();
}

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function visibleLength(text: string): number {
  return stripAnsi(text).length;
}

function padRight(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - visibleLength(text)));
}

function emit(levelColor: string, scope: string, message: string, detail?: unknown): void {
  const head = `${colorize(GRAY, timestamp())} ${formatScope(scope)} ${colorize(levelColor, message)}`;
  if (detail === undefined || detail === null || detail === '') {
    console.log(head);
    return;
  }

  const rendered = formatDetail(detail);
  if (!rendered) {
    console.log(head);
    return;
  }

  const indent = ' '.repeat(24);
  const lines = rendered.split('\n').map(line => `${indent}${colorize(GRAY, '│')} ${line}`);
  console.log(`${head}\n${lines.join('\n')}`);
}

function renderPanel(title: string, rows: PanelRow[], subtitle?: string): string {
  const renderedRows = rows.map(row => {
    const label = formatInline(row.label);
    const value = formatInline(row.value);
    return {
      label,
      value,
      line: `${label}: ${value}`,
    };
  });

  const width = Math.max(
    visibleLength(title),
    subtitle ? visibleLength(subtitle) : 0,
    ...renderedRows.map(row => visibleLength(row.line)),
  ) + 4;

  const top = `┌${'─'.repeat(width - 2)}┐`;
  const bottom = `└${'─'.repeat(width - 2)}┘`;
  const titleLine = `│ ${padRight(colorize(BOLD, title), width - 4)} │`;
  const lines: string[] = [top, titleLine];

  if (subtitle) {
    lines.push(`│ ${padRight(colorize(DIM, subtitle), width - 4)} │`);
  }

  if (renderedRows.length > 0) {
    lines.push(`│${' '.repeat(width - 2)}│`);
    for (const row of renderedRows) {
      const label = colorize(CYAN, `${row.label}:`);
      const value = colorize(WHITE, row.value);
      lines.push(`│ ${padRight(`${label} ${value}`, width - 4)} │`);
    }
  }

  lines.push(bottom);
  return lines.join('\n');
}

export function createLogger(scope: string) {
  return {
    info(message: string, detail?: unknown) {
      emit(BLUE, scope, formatMessage(message), detail);
    },
    success(message: string, detail?: unknown) {
      emit(GREEN, scope, formatMessage(message), detail);
    },
    warn(message: string, detail?: unknown) {
      emit(YELLOW, scope, formatMessage(message), detail);
    },
    error(message: string, detail?: unknown) {
      emit(RED, scope, formatMessage(message), detail);
    },
    muted(message: string, detail?: unknown) {
      emit(DIM, scope, formatMessage(message), detail);
    },
    section(title: string, detail?: unknown) {
      const line = `${colorize(BOLD, title)}`;
      const bar = colorize(GRAY, '─'.repeat(Math.max(8, Math.min(64, title.length + 12))));
      console.log(`${colorize(GRAY, '┌')} ${line} ${bar}`);
      if (detail !== undefined && detail !== null && detail !== '') {
        const rendered = formatDetail(detail).split('\n').map(line => `${colorize(GRAY, '│')} ${line}`);
        console.log(rendered.join('\n'));
      }
      console.log(`${colorize(GRAY, '└')}${colorize(GRAY, '─'.repeat(Math.max(8, Math.min(64, title.length + 12))))}`);
    },
    panel(title: string, rows: PanelRow[], subtitle?: string) {
      console.log(renderPanel(title, rows, subtitle));
    },
  };
}

export const logger = {
  createLogger,
};
