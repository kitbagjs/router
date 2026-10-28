import type { SourceFile, VariableDeclaration, ExportAssignment, Node } from 'ts-morph'

export type Diagnostic = {
  file: string,
  line: number,
  message: string,
}

export type ParsedModule = {
  file: string,
  sourceText: string,
  syntaxTree: SourceFile,
  templateTags: Set<string>,
  setupRange?: { start: number, end: number },
}

export type ReusableDefinition = {
  id: string,
  file: string,
  name: string,
  context?: Node,
}

export type ContextReferences = {
  routes: { index: number, route: RouteDefinition }[],
  length: number,
}

export type RouteDefinition = {
  id: string,
  routeModule: ParsedModule,
  routeDeclaration: VariableDeclaration | ExportAssignment,
  parent?: RouteDefinition,
  componentLoaders: ReusableDefinition[],
  reusableContextAttachments: { definition: ReusableDefinition, argument: Node }[],
  explicitLoaders: { loader?: ReusableDefinition, name: string, argument: Node }[],
  context?: { expression: Node, references: ContextReferences },
}

export type RouteExport = {
  file: string,
  name: string,
  routes: RouteDefinition[],
  array: boolean,
}

export type RouteDiscovery = {
  parsedModules: Map<string, ParsedModule>,
  routeDefinitions: Map<string, RouteDefinition>,
  routeExports: RouteExport[],
  definitionContexts: Map<string, ContextReferences>,
  diagnostics: Diagnostic[],
}

export type ResolveImportPath = (specifier: string, importer: string) => Promise<string | undefined>
