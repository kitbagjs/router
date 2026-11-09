import { realpath } from 'node:fs/promises'
import { relative } from 'node:path'
import { BuildEnvironment, createIdResolver, type Plugin, type ResolvedConfig, type ViteDevServer } from 'vite'
import { createRouteGenerator, type GenerationResult } from './generateRoutes'
import { warnDiscovery } from './warnDiscovery'
import { resolveRelativeImportPath } from './readModule'

export type RouterPluginOptions = {
  /** Explicit route modules or globs. Defaults to .route.ts and .routes.ts modules under Vite's root. Explicit patterns replace the defaults. */
  routes?: string[],
  /** Aggregate module path, relative to Vite's root. Set false to consume counterparts directly. */
  output?: string | false,
}

export default function router(options: RouterPluginOptions = {}): Plugin {
  let projectRoot: string
  let viteConfig: ResolvedConfig
  let routeGenerator: ReturnType<typeof createRouteGenerator>
  let devServer: ViteDevServer | undefined
  let reportedDiagnostics = new Set<string>()
  let regenerationTimer: ReturnType<typeof setTimeout> | undefined
  let pluginClosed = false
  let pendingRegeneration: Promise<void> = Promise.resolve()

  return {
    name: 'kitbag:routes',
    enforce: 'pre',
    async configResolved(resolved) {
      await initializeGenerator(resolved)
      await generateAndReportDiagnostics()
    },
    configureServer(vite) {
      devServer = vite
      vite.watcher.add(projectRoot)
      vite.watcher.on('add', scheduleRegeneration)
      vite.watcher.on('change', scheduleRegeneration)
      vite.watcher.on('unlink', scheduleRegeneration)
    },
    handleHotUpdate(context) {
      if (isDiscoveryInput(context.file) || context.file.endsWith('.generated.ts')) {
        return []
      }
    },
    async buildStart() {
      // Also regenerate for Rollup watch builds, where configResolved only runs once.
      const result = await generateAndReportDiagnostics()

      for (const dependency of result.dependencies) {
        this.addWatchFile(dependency)
      }
    },
    async closeBundle() {
      pluginClosed = true
      clearTimeout(regenerationTimer)
      devServer?.watcher.off('add', scheduleRegeneration)
      devServer?.watcher.off('change', scheduleRegeneration)
      devServer?.watcher.off('unlink', scheduleRegeneration)
      await pendingRegeneration
    },
  }

  async function initializeGenerator(resolved: ResolvedConfig): Promise<void> {
    viteConfig = resolved
    projectRoot = await realpath(viteConfig.root)
    const plugins = viteConfig.plugins.filter((plugin) => plugin.name === 'kitbag:routes')

    if (plugins.length > 1) {
      throw new Error('Configure one @kitbag/router/vite plugin per project so generated output has one owner.')
    }

    const resolveViteImport = createIdResolver(viteConfig)
    const resolverEnvironment = new BuildEnvironment('client', viteConfig)
    routeGenerator = createRouteGenerator({
      root: projectRoot,
      ...options,
      async resolveImportPath(specifier, importer) {
        const resolved = await resolveViteImport(resolverEnvironment, specifier, importer)

        if (resolved && !resolved.includes('?') && !resolved.startsWith('\0')) {
          return resolved
        }

        return resolveRelativeImportPath(specifier, importer)
      },
    })
  }

  function isPluginClosed(): boolean {
    return pluginClosed
  }

  async function generateAndReportDiagnostics(): Promise<GenerationResult> {
    const result = await routeGenerator.generate()
    const currentDiagnostics = new Set<string>()

    for (const diagnostic of result.diagnostics) {
      const key = JSON.stringify(diagnostic)
      currentDiagnostics.add(key)

      if (!reportedDiagnostics.has(key)) {
        warnDiscovery(viteConfig.logger, diagnostic)
      }
    }

    reportedDiagnostics = currentDiagnostics
    devServer?.watcher.add(result.dependencies)
    return result
  }

  function isDiscoveryInput(file: string): boolean {
    const normalized = file.startsWith(viteConfig.root) ? projectRoot + file.slice(viteConfig.root.length) : file
    const path = relative(projectRoot, normalized).replaceAll('\\', '/')
    const isOutsideProject = path.startsWith('../')
    const isIgnoredDirectory = /(^|\/)(node_modules|dist|\.git)\//.test(path)
    const isSourceFile = /\.(vue|[cm]?[jt]sx?)$/.test(path)
    const isGeneratedFile = path.endsWith('.generated.ts')
    return !isOutsideProject && !isIgnoredDirectory && isSourceFile && !isGeneratedFile
  }

  function scheduleRegeneration(file: string): void {
    if (isPluginClosed() || !isDiscoveryInput(file)) {
      return
    }

    clearTimeout(regenerationTimer)
    regenerationTimer = setTimeout(() => {
      pendingRegeneration = pendingRegeneration.then(regenerateAndReload)
    }, 30)
  }

  async function regenerateAndReload(): Promise<void> {
    if (isPluginClosed()) {
      return
    }

    try {
      await generateAndReportDiagnostics()

      if (isPluginClosed() || !devServer) {
        return
      }

      for (const environment of Object.values(devServer.environments)) {
        environment.moduleGraph.invalidateAll()
      }

      devServer.ws.send({ type: 'full-reload' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      viteConfig.logger.error(`[kitbag:routes] ${message}`)
      devServer?.ws.send({ type: 'error', err: { message, stack: '' } })
    }
  }
}
