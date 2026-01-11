import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { configSchema, type Config } from './lib/schemas.js'
import { OnSongError, ErrorCodes } from './lib/errors.js'

const CONFIG_DIR = join(homedir(), '.config', 'onsong-mcp')
const CONFIG_FILE = 'config.json'

export const DEFAULT_CONFIG: Config = {
  enableImport: false,
  logLevel: 'info',
  allowedHosts: [],
  callbackPort: 9876,
  dryRun: false,
}

export async function loadConfig(): Promise<Config> {
  const configPath = join(CONFIG_DIR, CONFIG_FILE)

  try {
    const content = await readFile(configPath, 'utf-8')
    const parsed: unknown = JSON.parse(content)
    const result = configSchema.safeParse(parsed)

    if (!result.success) {
      throw new OnSongError(ErrorCodes.INVALID_CONFIG, {
        path: configPath,
        errors: result.error.flatten(),
      })
    }

    return { ...DEFAULT_CONFIG, ...result.data }
  } catch (error) {
    if (error instanceof OnSongError) {
      throw error
    }
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return DEFAULT_CONFIG
    }
    throw new OnSongError(ErrorCodes.FILE_READ_ERROR, {
      path: configPath,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const configPath = join(CONFIG_DIR, CONFIG_FILE)

  const result = configSchema.safeParse(config)
  if (!result.success) {
    throw new OnSongError(ErrorCodes.INVALID_CONFIG, {
      errors: result.error.flatten(),
    })
  }

  try {
    await mkdir(CONFIG_DIR, { recursive: true })
    await writeFile(configPath, JSON.stringify(result.data, null, 2), 'utf-8')
  } catch (error) {
    throw new OnSongError(ErrorCodes.FILE_WRITE_ERROR, {
      path: configPath,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export function validateHost(host: string, allowedHosts: string[]): boolean {
  if (allowedHosts.length === 0) {
    return true
  }
  return allowedHosts.includes(host)
}

export { CONFIG_DIR, CONFIG_FILE }
