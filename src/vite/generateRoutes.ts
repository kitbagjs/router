import { randomUUID } from 'node:crypto'
import { mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import glob from 'fast-glob'
import { createImportPlan } from './planImports'
import { discoverRoutes } from './discoverRoutes'
import { GENERATED_HEADER, generateRouteModules, getGeneratedModulePath, getRelativeImportSpecifier } from './generateRouteModules'
import type { Diagnostic, ResolveImportPath, RouteExport } from './types'

export type GeneratorOptions = {
  root: string,
  routes?: string[],
  output?: string | false,
  resolveImportPath?: ResolveImportPath,
}

export type GenerationResult = {
  files: string[],
  dependencies: string[],
  diagnostics: Diagnostic[],
  changed: boolean,
}

const excludedRouteFiles = ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/*.generated.ts', '**/*.d.ts', '**/*.spec.*', '**/*.test.*']

export function createRouteGenerator(options: GeneratorOptions): { generate: () => Promise<GenerationResult> } {
  let pendingGeneration: Promise<unknown> = Promise.resolve()

  function generate(): Promise<GenerationResult> {
    // Serialize watcher events so an older generation cannot overwrite a newer one.
    const nextGeneration = pendingGeneration.then(() => generateRoutes(options))
    pendingGeneration = nextGeneration.catch(() => undefined)
    return nextGeneration
  }

  return { generate }
}

async function generateRoutes(options: GeneratorOptions): Promise<GenerationResult> {
  const projectRoot = await realpath(resolve(options.root))
  const { routeFiles, diagnostics } = await findRouteFiles(projectRoot, options.routes)
  const discovery = await discoverRoutes(routeFiles, options.resolveImportPath)
  const generatedModules = await generateRouteModules(discovery, options.resolveImportPath)
  const outputFiles = generatedModules.files

  if (options.output !== false) {
    const registryPath = resolve(projectRoot, options.output ?? 'src/routes.generated.ts')
    validateRegistryPath(registryPath, outputFiles)
    outputFiles.set(registryPath, generateRouteRegistry(registryPath, discovery.routeExports))
  }

  // Finish parsing and generation before replacing any previously valid output.
  const wroteFiles = await writeChangedFiles(outputFiles)
  const removedFiles = await removeStaleGeneratedFiles(projectRoot, outputFiles)

  return {
    files: [...outputFiles.keys()],
    dependencies: [...discovery.parsedModules.keys()],
    diagnostics: [...diagnostics, ...generatedModules.diagnostics],
    changed: wroteFiles || removedFiles,
  }
}

async function findRouteFiles(projectRoot: string, configuredPatterns?: string[]): Promise<{ routeFiles: string[], diagnostics: Diagnostic[] }> {
  const patterns = configuredPatterns ?? ['**/*.route{,s}.ts']
  const routeFiles: string[] = []
  const diagnostics: Diagnostic[] = []

  for (const pattern of patterns) {
    const matchingPaths = await glob(pattern, { cwd: projectRoot, absolute: true, onlyFiles: true, ignore: excludedRouteFiles })
    matchingPaths.sort()
    routeFiles.push(...await Promise.all(matchingPaths.map((file) => realpath(file))))

    if (!matchingPaths.length && configuredPatterns) {
      diagnostics.push({ file: projectRoot, line: 1, message: `No route modules match ${pattern}.` })
    }
  }

  if (!configuredPatterns) {
    routeFiles.sort()
  }

  return { routeFiles, diagnostics }
}

function validateRegistryPath(registryPath: string, outputFiles: Map<string, string>): void {
  if (!registryPath.endsWith('.generated.ts')) {
    throw new Error('The aggregate output must end in .generated.ts so it is excluded from discovery.')
  }

  if (outputFiles.has(registryPath)) {
    throw new Error(`The aggregate conflicts with a generated route module: ${registryPath}. Choose another output path or set output: false.`)
  }
}

function generateRouteRegistry(registryPath: string, routeExports: RouteExport[]): string {
  const requiredImports = routeExports.map((routeExport) => ({
    exportName: routeExport.name,
    moduleSpecifier: getRelativeImportSpecifier(registryPath, getGeneratedModulePath(routeExport.file)),
  }))
  const importPlan = createImportPlan(requiredImports, ['routes'])
  const routeReferences = routeExports.map((routeExport, index) => {
    const importName = importPlan.getImportReference(routeExport.name, requiredImports[index].moduleSpecifier)
    return routeExport.array ? `...${importName}` : importName
  })
  const arrayEntries = routeReferences.length ? `\n${routeReferences.map((route) => `  ${route},`).join('\n')}\n` : ''

  return GENERATED_HEADER + importPlan.declarations.join('\n') + `\n\nexport const routes = [${arrayEntries}] as const\n`
}

async function writeChangedFiles(outputFiles: Map<string, string>): Promise<boolean> {
  let changed = false

  for (const [filePath, generatedContent] of outputFiles) {
    const previousContent = await readFile(filePath, 'utf8').catch(() => undefined)

    if (previousContent === generatedContent) {
      continue
    }

    await mkdir(dirname(filePath), { recursive: true })
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`

    try {
      await writeFile(temporaryPath, generatedContent)
      await rename(temporaryPath, filePath)
    } finally {
      await rm(temporaryPath, { force: true })
    }

    changed = true
  }

  return changed
}

async function removeStaleGeneratedFiles(projectRoot: string, outputFiles: Map<string, string>): Promise<boolean> {
  const existingPaths = await glob('**/*.generated.ts', { cwd: projectRoot, absolute: true, ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'] })
  let changed = false

  for (const filePath of existingPaths) {
    if (outputFiles.has(filePath)) {
      continue
    }

    const content = await readFile(filePath, 'utf8')

    if (content.startsWith(GENERATED_HEADER)) {
      await rm(filePath)
      changed = true
    }
  }

  return changed
}
