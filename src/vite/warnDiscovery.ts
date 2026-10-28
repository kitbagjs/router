import type { Logger } from 'vite'
import type { Diagnostic } from './types'

export function warnDiscovery(logger: Logger, diagnostic: Diagnostic): void {
  logger.warn(`[kitbag:routes] ${diagnostic.file}:${diagnostic.line}\n${diagnostic.message}`)
}
