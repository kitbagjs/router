#!/usr/bin/env node
import { runRouterCommand } from '../dist/plugin/cli.js'

try {
  await runRouterCommand(process.argv.slice(2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
