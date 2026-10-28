import { Node, SyntaxKind, type CallExpression } from 'ts-morph'
import { createModuleReader, resolveRelativeImportPath } from './readModule'
import { createDeclarationResolver, type ResolvedDeclaration } from './resolveDeclarations'
import { createComponentLoaderDiscovery } from './discoverComponentLoaders'
import { getSourcePath, getObjectProperty, unwrapExpression } from './syntax'
import type { ContextReferences, RouteDiscovery, ResolveImportPath, RouteDefinition, ParsedModule } from './types'

export async function discoverRoutes(routeFiles: string[], resolveImportPath: ResolveImportPath = resolveRelativeImportPath): Promise<RouteDiscovery> {
  const parseModule = createModuleReader()
  const discovery: RouteDiscovery = { parsedModules: new Map(), routeDefinitions: new Map(), routeExports: [], definitionContexts: new Map(), diagnostics: [] }
  const pendingModuleReads = new Map<string, Promise<ParsedModule>>()

  function reportDiagnostic(node: Node, message: string): void {
    const file = getSourcePath(node)
    const line = node.getStartLineNumber()

    if (!discovery.diagnostics.some((diagnostic) => diagnostic.file === file && diagnostic.line === line && diagnostic.message === message)) {
      discovery.diagnostics.push({ file, line, message })
    }
  }

  async function readModule(file: string): Promise<ParsedModule> {
    let pending = pendingModuleReads.get(file)

    if (!pending) {
      pending = parseModule(file)
      pendingModuleReads.set(file, pending)
    }

    const parsedModule = await pending
    discovery.parsedModules.set(file, parsedModule)
    return parsedModule
  }

  const declarations = createDeclarationResolver(readModule, resolveImportPath)
  const { resolveDeclaration, resolveExport, getExportNames, isApiCall, resolveLoaderDefinition } = declarations
  const { resolveViewComponentPath, discoverComponentLoaders } = createComponentLoaderDiscovery(readModule, resolveImportPath, declarations, reportDiagnostic)

  for (const file of routeFiles) {
    for (const name of await getExportNames(file)) {
      const declaration = await resolveExport(file, name)
      const result = declaration ? await collectExportedRoutes(declaration) : undefined

      if (result) {
        discovery.routeExports.push({ file, name, ...result })
      } else if (declaration && !('api' in declaration)) {
        const initializer = Node.isVariableDeclaration(declaration) ? declaration.getInitializer() : declaration

        if (initializer && Node.isCallExpression(unwrapExpression(initializer))) {
          const call = unwrapExpression(initializer).asKindOrThrow(SyntaxKind.CallExpression)
          const factory = await resolveDeclaration(call.getExpression())

          if (!factory || !('api' in factory)) {
            reportDiagnostic(declaration, `Cannot determine whether export ${name} is a route. It is not collected; export a createRoute definition directly.`)
          }
        }
      }
    }
  }

  return discovery

  async function discoverRouteDefinition(node: Node, parentTraversal = new Set<Node>()): Promise<RouteDefinition | undefined> {
    const resolvedDeclaration = await resolveDeclaration(node)

    if (!resolvedDeclaration || 'api' in resolvedDeclaration) {
      return undefined
    }

    if (!Node.isVariableDeclaration(resolvedDeclaration) && !Node.isExportAssignment(resolvedDeclaration)) {
      return undefined
    }

    if (parentTraversal.has(resolvedDeclaration)) {
      return undefined
    }

    const id = `${getSourcePath(resolvedDeclaration)}#${Node.isVariableDeclaration(resolvedDeclaration) ? resolvedDeclaration.getName() : 'default'}`
    const knownRoute = discovery.routeDefinitions.get(id)

    if (knownRoute) {
      return knownRoute
    }

    const initializer = Node.isVariableDeclaration(resolvedDeclaration) ? resolvedDeclaration.getInitializer() : resolvedDeclaration.getExpression()

    if (!initializer) {
      return undefined
    }

    const construction = await readRouteConstruction(initializer)

    if (!construction) {
      return undefined
    }

    const { routeFactoryCall, chainedMethods } = construction
    parentTraversal.add(resolvedDeclaration)
    const parentExpression = getObjectProperty(routeFactoryCall.getArguments().at(0), 'parent')
    const parent = parentExpression ? await discoverRouteDefinition(parentExpression, parentTraversal) : undefined

    if (parentExpression && !parent) {
      throw new Error(`Cannot resolve route parent at ${id}`)
    }

    const routeDefinition: RouteDefinition = {
      id,
      routeModule: await readModule(getSourcePath(resolvedDeclaration)),
      routeDeclaration: resolvedDeclaration,
      parent,
      componentLoaders: [],
      explicitLoaders: [],
      reusableContextAttachments: [],
    }

    await discoverMethodDependencies(routeDefinition, chainedMethods)

    // Contexts can refer back to this route; record it before following those references.
    discovery.routeDefinitions.set(id, routeDefinition)
    const context = getObjectProperty(routeFactoryCall.getArguments().at(0), 'context')

    if (context) {
      routeDefinition.context = { expression: context, references: await discoverContextReferences(context) }
    }

    await discoverReusableContexts(routeDefinition)

    return routeDefinition
  }

  type ChainedMethod = { name: string, arguments: Node[] }

  async function readRouteConstruction(initializer: Node): Promise<{ routeFactoryCall: CallExpression, chainedMethods: ChainedMethod[] } | undefined> {
    let routeFactoryCall = unwrapExpression(initializer)
    const chainedMethods: ChainedMethod[] = []

    while (Node.isCallExpression(routeFactoryCall) && Node.isPropertyAccessExpression(routeFactoryCall.getExpression()) && !await isApiCall(routeFactoryCall, 'createRoute')) {
      const expression = routeFactoryCall.getExpression().asKindOrThrow(SyntaxKind.PropertyAccessExpression)
      chainedMethods.unshift({ name: expression.getName(), arguments: routeFactoryCall.getArguments() })
      routeFactoryCall = unwrapExpression(expression.getExpression())
    }

    if (!Node.isCallExpression(routeFactoryCall) || !await isApiCall(routeFactoryCall, 'createRoute')) {
      return undefined
    }

    return { routeFactoryCall, chainedMethods }
  }

  async function discoverMethodDependencies(routeDefinition: RouteDefinition, chainedMethods: ChainedMethod[]): Promise<void> {
    for (const method of chainedMethods) {
      const argument = method.arguments.at(0)
      const options = method.arguments.at(1)

      if (argument) {
        const shared = await declarations.resolveReusableDefinition(argument, method.name === 'addView' ? 'createView' : 'createHook')

        if (shared?.context) {
          routeDefinition.reusableContextAttachments.push({ definition: shared, argument })
        }
      }

      if (method.name === 'addView' && argument) {
        const file = await resolveViewComponentPath(argument)

        if (file) {
          routeDefinition.componentLoaders.push(...await discoverComponentLoaders(file))
        } else {
          reportDiagnostic(argument, 'Cannot follow this route view to discover its loaders. Register its loaders explicitly.')
        }
      }

      if (method.name === 'addLoader' && argument) {
        const name = getObjectProperty(options, 'name')

        if (name && !Node.isStringLiteral(name)) {
          throw new Error(`Loader attachment names must be string literals for generation: ${routeDefinition.id}`)
        }

        routeDefinition.explicitLoaders.push({
          argument,
          loader: await resolveLoaderDefinition(argument),
          name: name && Node.isStringLiteral(name) ? name.getLiteralValue() : 'default',
        })
      }
    }
  }

  async function discoverReusableContexts(routeDefinition: RouteDefinition): Promise<void> {
    const reusableDefinitions = [...routeDefinition.componentLoaders, ...routeDefinition.reusableContextAttachments.map((entry) => entry.definition)]

    for (const attachment of routeDefinition.explicitLoaders) {
      if (attachment.loader) {
        reusableDefinitions.push(attachment.loader)
      }
    }

    for (const dependency of reusableDefinitions) {
      if (dependency.context && !discovery.definitionContexts.has(dependency.id)) {
        discovery.definitionContexts.set(dependency.id, { routes: [], length: 0 })
        discovery.definitionContexts.set(dependency.id, await discoverContextReferences(dependency.context))
      }
    }
  }

  async function resolveContextElements(node: Node, visited = new Set<Node>()): Promise<Node[]> {
    const resolvedDeclaration = await resolveDeclaration(node)

    if (!resolvedDeclaration || 'api' in resolvedDeclaration || visited.has(resolvedDeclaration)) {
      throw new Error(`Cannot resolve static route context at ${getSourcePath(node)}:${node.getStartLineNumber()}`)
    }

    visited.add(resolvedDeclaration)
    const value = Node.isVariableDeclaration(resolvedDeclaration) ? resolvedDeclaration.getInitializer() : resolvedDeclaration

    if (!value || !Node.isArrayLiteralExpression(unwrapExpression(value))) {
      throw new Error(`Use a static array for route context at ${getSourcePath(node)}:${node.getStartLineNumber()}`)
    }

    const elements: Node[] = []

    for (const element of unwrapExpression(value).asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
      .getElements()) {
      elements.push(...Node.isSpreadElement(element) ? await resolveContextElements(element.getExpression(), new Set(visited)) : [element])
    }

    return elements
  }

  async function discoverContextReferences(node: Node): Promise<ContextReferences> {
    const references: ContextReferences['routes'] = []
    const elements = await resolveContextElements(node)

    for (const [index, element] of elements.entries()) {
      const referencedRoute = await discoverRouteDefinition(element)

      if (referencedRoute) {
        references.push({ index, route: referencedRoute })
      }
    }

    return { routes: references, length: elements.length }
  }

  async function collectExportedRoutes(node: ResolvedDeclaration, visited = new Set<Node>()): Promise<{ routes: RouteDefinition[], array: boolean } | undefined> {
    if ('api' in node || visited.has(node)) {
      return undefined
    }

    visited.add(node)
    const routeDefinition = await discoverRouteDefinition(node)

    if (routeDefinition) {
      return { routes: [routeDefinition], array: false }
    }

    const value = Node.isVariableDeclaration(node) ? node.getInitializer() : Node.isExportAssignment(node) ? node.getExpression() : node

    if (!value) {
      return undefined
    }

    const expression = unwrapExpression(value)

    if (Node.isArrayLiteralExpression(expression)) {
      const routes: RouteDefinition[] = []
      let unresolved: Node | undefined

      for (const element of expression.getElements()) {
        const referencedRoute = Node.isSpreadElement(element) ? element.getExpression() : element
        const resolvedDeclaration = await resolveDeclaration(referencedRoute)
        const exportedRoutes = resolvedDeclaration ? await collectExportedRoutes(resolvedDeclaration, new Set(visited)) : undefined

        if (!exportedRoutes) {
          unresolved = element
          continue
        }

        routes.push(...exportedRoutes.routes)
      }

      if (!routes.length) {
        return undefined
      }

      if (unresolved) {
        throw new Error(`Cannot resolve route array entry at ${getSourcePath(expression)}:${unresolved.getStartLineNumber()}`)
      }

      return { routes, array: true }
    }

    return undefined
  }
}
