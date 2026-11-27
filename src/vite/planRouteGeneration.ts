import { SyntaxKind } from 'ts-morph'
import type { Diagnostic, RouteDiscovery, RouteDefinition, ReusableDefinition, ResolveImportPath } from './types'

export type LoaderAttachment = { loader?: ReusableDefinition, name: string }

export type GenerationPlan = {
  loaderAdditions: Map<RouteDefinition, LoaderAttachment[]>,
  contextExportNames: Map<RouteDefinition, string>,
  modulePaths: Set<string>,
  diagnostics: Diagnostic[],
}

export async function planRouteGeneration(discovery: RouteDiscovery, resolveImportPath: ResolveImportPath): Promise<GenerationPlan> {
  const diagnostics = [...discovery.diagnostics]
  const loaderAdditions = planLoaderAttachments(discovery, diagnostics)
  const contextExportNames = nameContextExports(discovery)
  const modulePaths = await collectGeneratedModulePaths(discovery, resolveImportPath)
  return { loaderAdditions, contextExportNames, modulePaths, diagnostics }
}

function planLoaderAttachments(discovery: RouteDiscovery, diagnostics: Diagnostic[]): Map<RouteDefinition, LoaderAttachment[]> {
  const loaderAdditions = new Map<RouteDefinition, LoaderAttachment[]>()
  const completedAttachments = new Map<RouteDefinition, LoaderAttachment[]>()
  function completeRouteAttachments(route: RouteDefinition): LoaderAttachment[] {
    const knownAttachments = completedAttachments.get(route)

    if (knownAttachments) {
      return knownAttachments
    }

    const inheritedAttachments = route.parent ? completeRouteAttachments(route.parent) : []
    // A later explicit attachment replaces an earlier attachment with the same local name.
    const explicitAttachments = [...new Map(route.explicitLoaders.map((entry) => [entry.name, entry])).values()]
    const availableAttachments = [...inheritedAttachments, ...explicitAttachments]
    const missingAttachments: LoaderAttachment[] = []

    for (const loader of route.componentLoaders) {
      const matchingAttachments = availableAttachments.filter((entry) => entry.loader?.id === loader.id)

      if (matchingAttachments.length === 1) {
        continue
      }

      if (matchingAttachments.length > 1 || availableAttachments.some((entry) => entry.name === loader.name)) {
        diagnostics.push({
          file: route.routeModule.file,
          line: route.routeDeclaration.getStartLineNumber(),
          message: `Cannot automatically attach ${loader.name}: ${matchingAttachments.length > 1 ? 'the definition has multiple explicit attachments' : 'the attachment name is already used'}. Select or register this loader explicitly.`,
        })
        continue
      }

      const attachment = { loader, name: loader.name }
      availableAttachments.push(attachment)
      missingAttachments.push(attachment)
    }

    loaderAdditions.set(route, missingAttachments)
    completedAttachments.set(route, availableAttachments)
    return availableAttachments
  }

  for (const route of discovery.routeDefinitions.values()) {
    completeRouteAttachments(route)
  }

  return loaderAdditions
}

function nameContextExports(discovery: RouteDiscovery): Map<RouteDefinition, string> {
  const contextExportNames = new Map<RouteDefinition, string>()
  const contextRoutes = [
    ...[...discovery.definitionContexts.values()].flatMap((context) => context.routes),
    ...[...discovery.routeDefinitions.values()].flatMap((route) => route.context?.references.routes ?? []),
  ]

  for (const { route } of contextRoutes) {
    let name = `__kitbag_context_${contextExportNames.size}`

    while (route.routeModule.syntaxTree.getDescendantsOfKind(SyntaxKind.Identifier).some((node) => node.getText() === name)) {
      name += '_'
    }

    if (!contextExportNames.has(route)) {
      contextExportNames.set(route, name)
    }
  }

  return contextExportNames
}

async function collectGeneratedModulePaths(discovery: RouteDiscovery, resolveImportPath: ResolveImportPath): Promise<Set<string>> {
  const generatedModulePaths = new Set([...discovery.routeDefinitions.values()].map((route) => route.routeModule.file))
  discovery.routeExports.forEach((entry) => generatedModulePaths.add(entry.file))
  // Reexport barrels and explicit registries must point at the completed definitions too.
  let foundDependentModule = true

  while (foundDependentModule) {
    foundDependentModule = false

    for (const parsedModule of discovery.parsedModules.values()) {
      if (generatedModulePaths.has(parsedModule.file) || parsedModule.file.endsWith('.vue')) {
        continue
      }

      for (const declaration of parsedModule.syntaxTree.getExportDeclarations()) {
        const specifier = declaration.getModuleSpecifierValue()
        const reexportedModulePath = specifier ? await resolveImportPath(specifier, parsedModule.file) : undefined

        if (reexportedModulePath && generatedModulePaths.has(reexportedModulePath)) {
          generatedModulePaths.add(parsedModule.file)
          foundDependentModule = true
        }
      }
    }
  }

  return generatedModulePaths
}
