import MagicString from 'magic-string'
import { normalizePath } from 'vite'
import { createGenerator, MACROS, parseComponent } from './generator.mjs'

const RUNTIME = 'virtual:kitbag-loader-runtime'

/** Vite adapter: generation lives in generator.mjs and can run without a server. */
export function loaderDiscovery(options) {
  let generator
  let watched = new Set()
  let pending = Promise.resolve()
  function generate(context) {
    pending = pending.catch(() => {}).then(async () => {
      const result = await generator.generate({
        resolveId: async (id, importer) => (await context.resolve(id, importer, { skipSelf: true }))?.id,
        watchFile: file => context.addWatchFile(file),
      })
      watched = result.watched
    })
    return pending
  }
  return {
    name: 'kitbag-loader-discovery-poc',
    enforce: 'pre',
    configResolved(config) { generator = createGenerator({ ...options, root: config.root }) },
    async buildStart() { await generate(this) },
    resolveId(id) {
      if ([MACROS, RUNTIME].includes(id)) return '\0' + id
    },
    load(id) {
      if (id === '\0' + MACROS) return 'export function defineLoader() { throw new Error("defineLoader was not compiled"); }'
      if (id === '\0' + RUNTIME) return `
        import { useRoute } from '@kitbag/router';
        export function useLoaderPromise(key) {
          const data = useRoute().data;
          if (!data || !(key in data)) throw new Error('No discovered loader registered for ' + key + '. Import routes.generated.ts when creating the router.');
          return data[key];
        }`
    },
    async transform(code, id) {
      if (!id.endsWith('.vue') || id.startsWith('\0')) return
      const component = parseComponent(code, id)
      if (!component.loaders.length) return
      const output = new MagicString(code)
      const { script, scriptSetup } = component.descriptor
      const imports = component.source.getImportDeclarations().filter(node => node.getModuleSpecifierValue() !== MACROS)
        .map(node => node.getText()).join('\n')
      output.overwrite(script.loc.start.offset, script.loc.end.offset,
        `\n${imports}\nexport { ${component.loaders.map(loader => loader.name).join(', ')} } from ${JSON.stringify(generator.loaderFile(id))};\n`)
      output.appendLeft(scriptSetup.loc.start.offset,
        `\nimport { useLoaderPromise as __kitbag_useLoaderPromise } from '${RUNTIME}';\n`
        + component.loaders.map(loader => `const ${loader.name} = __kitbag_useLoaderPromise(${JSON.stringify(loader.key)});`).join('\n') + '\n')
      return { code: output.toString(), map: output.generateMap({ hires: true, source: id }) }
    },
    async handleHotUpdate(context) {
      const file = normalizePath(context.file)
      if (file.startsWith(generator.output + '/')) return []
      if (watched.has(file)) {
        await generate(this)
        for (const environment of Object.values(context.server.environments)) environment.moduleGraph.invalidateAll()
        context.server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }
}
