import { Node, SyntaxKind } from 'ts-morph'
import { getSourcePath, getObjectProperty, normalizeComponentTag, unwrapExpression } from './syntax'
import type { DeclarationResolver } from './resolveDeclarations'
import type { ReusableDefinition, ResolveImportPath, ParsedModule } from './types'

type ComponentLoaderDiscovery = {
  resolveViewComponentPath: (node: Node) => Promise<string | undefined>,
  discoverComponentLoaders: (file: string) => Promise<ReusableDefinition[]>,
}

export function createComponentLoaderDiscovery(
  readModule: (file: string) => Promise<ParsedModule>,
  resolveImportPath: ResolveImportPath,
  declarations: DeclarationResolver,
  reportDiagnostic: (node: Node, message: string) => void,
): ComponentLoaderDiscovery {
  const { resolveDeclaration, isApiCall, resolveLoaderDefinition } = declarations
  const cachedComponentLoaders = new Map<string, ReusableDefinition[]>()
  const activeComponentPaths = new Set<string>()

  async function resolveComponentExportPath(file: string, name: string, visited = new Set<string>()): Promise<string | undefined> {
    if (file.endsWith('.vue') && name === 'default') {
      return file
    }

    const key = `${file}#${name}`

    if (visited.has(key)) {
      return undefined
    }

    visited.add(key)
    const parsedModule = await readModule(file)

    for (const declaration of parsedModule.syntaxTree.getExportDeclarations()) {
      const exportSpecifier = declaration.getNamedExports().find((exportSpecifier) => (exportSpecifier.getAliasNode()?.getText() ?? exportSpecifier.getName()) === name)
      const specifier = declaration.getModuleSpecifierValue()
      const dependencyPath = specifier ? await resolveImportPath(specifier, file) : undefined

      if (exportSpecifier && dependencyPath) {
        return resolveComponentExportPath(dependencyPath, exportSpecifier.getName(), visited)
      }

      if (!declaration.getNamedExports().length && dependencyPath) {
        const found = await resolveComponentExportPath(dependencyPath, name, visited)

        if (found) {
          return found
        }
      }
    }

    return undefined
  }

  async function resolveViewComponentPath(input: Node): Promise<string | undefined> {
    const node = unwrapExpression(input)

    if (Node.isIdentifier(node)) {
      const declaration = node.getSymbol()?.getDeclarations()[0]
      const importDeclaration = declaration?.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)

      if (importDeclaration) {
        const dependencyPath = await resolveImportPath(importDeclaration.getModuleSpecifierValue(), getSourcePath(node))

        if (dependencyPath?.endsWith('.vue')) {
          return dependencyPath
        }

        if (dependencyPath && declaration && Node.isImportSpecifier(declaration)) {
          const component = await resolveComponentExportPath(dependencyPath, declaration.getName())

          if (component) {
            return component
          }
        }
      }

      const resolvedDeclaration = await resolveDeclaration(node)

      if (resolvedDeclaration && !('api' in resolvedDeclaration) && Node.isVariableDeclaration(resolvedDeclaration)) {
        const initializer = resolvedDeclaration.getInitializer()
        return initializer ? resolveViewComponentPath(initializer) : undefined
      }
    }

    if (Node.isCallExpression(node) && await isApiCall(node, 'createView')) {
      const component = getObjectProperty(node.getArguments().at(0), 'component')
      return component ? resolveViewComponentPath(component) : undefined
    }

    if (Node.isCallExpression(node) && await isApiCall(node, 'defineAsyncComponent')) {
      const argument = node.getArguments().at(0)
      return argument ? resolveViewComponentPath(getObjectProperty(argument, 'loader') ?? argument) : undefined
    }

    if (Node.isArrowFunction(node)) {
      const body = unwrapExpression(node.getBody())

      const calledExpression = Node.isCallExpression(body) ? body.getExpression() : undefined

      if (Node.isCallExpression(body) && calledExpression?.getKind() === SyntaxKind.ImportKeyword) {
        const argument = body.getArguments().at(0)

        if (argument && Node.isStringLiteral(argument)) {
          return resolveImportPath(argument.getLiteralValue(), getSourcePath(node))
        }
      }
    }

    return undefined
  }

  async function discoverComponentLoaders(file: string): Promise<ReusableDefinition[]> {
    if (activeComponentPaths.has(file)) {
      return []
    }

    const cached = cachedComponentLoaders.get(file)

    if (cached) {
      return cached
    }

    activeComponentPaths.add(file)
    const parsedModule = await readModule(file)
    const discoveredLoaders = await discoverLoaderCalls(parsedModule)
    discoveredLoaders.push(...await discoverImportedDependencies(parsedModule))

    activeComponentPaths.delete(file)
    // Do not cache a partial traversal of a recursive component graph.
    if (!activeComponentPaths.size) {
      cachedComponentLoaders.set(file, discoveredLoaders)
    }
    return [...new Map(discoveredLoaders.map((loaderDefinition) => [loaderDefinition.id, loaderDefinition])).values()]
  }

  async function discoverLoaderCalls(parsedModule: ParsedModule): Promise<ReusableDefinition[]> {
    const discoveredLoaders: ReusableDefinition[] = []
    for (const call of parsedModule.syntaxTree.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      if (!await isApiCall(call, 'useLoader')) {
        continue
      }

      const argument = call.getArguments().at(0)

      if (!argument) {
        continue
      }

      if (selectsRegisteredRouteLoader(argument)) {
        continue
      }

      const loaderDefinition = await resolveLoaderDefinition(argument)

      if (loaderDefinition) {
        discoveredLoaders.push(loaderDefinition)
      } else {
        reportDiagnostic(call, 'Cannot automatically register this loader. Use an exported module-scope createLoader definition; the existing useLoader call retains its runtime behavior.')
      }
    }

    return discoveredLoaders
  }

  async function discoverImportedDependencies(parsedModule: ParsedModule): Promise<ReusableDefinition[]> {
    const discoveredLoaders: ReusableDefinition[] = []
    for (const declaration of parsedModule.syntaxTree.getImportDeclarations()) {
      if (declaration.isTypeOnly()) {
        continue
      }

      const importedIdentifiers = [declaration.getDefaultImport(), ...declaration.getNamedImports().map((exportSpecifier) => exportSpecifier.getAliasNode() ?? exportSpecifier.getNameNode())]

      for (const importedIdentifier of importedIdentifiers) {
        if (!importedIdentifier) {
          continue
        }

        const isRenderedComponent = [...parsedModule.templateTags].some((tag) => normalizeComponentTag(tag) === normalizeComponentTag(importedIdentifier.getText()))
        const isCalledComposable = parsedModule.syntaxTree.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => call.getExpression().getText() === importedIdentifier.getText())

        if (!isRenderedComponent && !isCalledComposable) {
          continue
        }

        const api = await resolveDeclaration(importedIdentifier)

        if (api && 'api' in api) {
          continue
        }

        const dependencyPath = isRenderedComponent ? await resolveViewComponentPath(importedIdentifier) : await resolveImportPath(declaration.getModuleSpecifierValue(), parsedModule.file)

        if (dependencyPath && /\.(vue|[cm]?[jt]sx?)$/.test(dependencyPath) && !dependencyPath.includes('/node_modules/')) {
          discoveredLoaders.push(...await discoverComponentLoaders(dependencyPath))
        } else if (isRenderedComponent) {
          reportDiagnostic(importedIdentifier, 'Cannot follow this component to discover its loaders. Register its loaders explicitly.')
        }
      }
    }

    return discoveredLoaders
  }

  return { resolveViewComponentPath, discoverComponentLoaders }
}

function selectsRegisteredRouteLoader(argument: Node): boolean {
  if (!Node.isPropertyAccessExpression(argument)) {
    return false
  }

  const loaderCollection = argument.getExpression()
  return Node.isPropertyAccessExpression(loaderCollection) && loaderCollection.getName() === 'loaders'
}
