import pino from 'pino'
import type { LogLevel } from './types.js'

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
}

export function createLogger(level: LogLevel = 'info'): pino.Logger {
  return pino({
    name: 'onsong-mcp',
    level,
    transport: {
      target: 'pino/file',
      options: { destination: 2 },
    },
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  })
}

export function isValidLogLevel(level: string): level is LogLevel {
  return level in LOG_LEVELS
}

let logger = createLogger('info')

export function getLogger(): pino.Logger {
  return logger
}

export function setLogger(newLogger: pino.Logger): void {
  logger = newLogger
}

export function createChildLogger(bindings: pino.Bindings): pino.Logger {
  return logger.child(bindings)
}

export { pino }
export type { Logger } from 'pino'
