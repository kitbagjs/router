import { parseArgs } from 'node:util'

const help = `Usage: router generate [options]

Generate route files using your Vite configuration, without a server or build.

Options:
  -c, --config <file>  Path to the Vite config
      --root <path>    Project root (defaults to the current directory)
  -m, --mode <mode>    Vite mode (defaults to development)
  -h, --help           Show this help
`

export async function runRouterCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      config: { type: 'string', short: 'c' },
      root: { type: 'string' },
      mode: { type: 'string', short: 'm' },
      help: { type: 'boolean', short: 'h' },
    },
  })

  if (values.help || !args.length) {
    process.stdout.write(help)
    return
  }

  if (positionals.length !== 1 || positionals[0] !== 'generate') {
    throw new Error('Expected "router generate". Run "router --help" for usage.')
  }

  const { resolveConfig } = await import('vite')
  // Resolving the config runs the router plugin's generation hook without creating a server.
  const config = await resolveConfig({
    configFile: values.config,
    root: values.root,
    mode: values.mode,
  }, 'serve')
  const plugin = config.plugins.find((plugin) => plugin.name === 'kitbag:routes')

  if (!plugin) {
    throw new Error('Add router() from @kitbag/router/vite to your Vite plugins before running router generate.')
  }

  config.logger.info('Routes generated.')
}
