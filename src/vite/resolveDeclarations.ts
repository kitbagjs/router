import { Node, SyntaxKind, type CallExpression } from 'ts-morph'
import { getSourcePath, getObjectProperty, unwrapExpression } from './syntax'
import type { ReusableDefinition, ResolveImportPath, ParsedModule } from './types'

type Api = { api: string }
// Retain API origin through aliases so a user function named useLoader is not mistaken for ours.
export type ResolvedDeclaration = Node | Api

export type DeclarationResolver = {
  resolveExport: (file: string, name: string) => Promise<ResolvedDeclaration | undefined>,
  resolveDeclaration: (node: Node) => Promise<ResolvedDeclaration | undefined>,
  isApiCall: (call: CallExpression, name: string) => Promise<boolean>,
  resolveReusableDefinition: (node: Node, apiName: string) => Promise<ReusableDefinition | undefined>,
  resolveLoaderDefinition: (node: Node) => Promise<ReusableDefinition | undefined>,
  getExportNames: (file: string) => Promise<string[]>,
}

export function createDeclarationResolver(readModule: (file: string) => Promise<ParsedModule>, resolveImportPath: ResolveImportPath): DeclarationResolver {
  async function resolveExport(file: string, name: string, visited = new Set<string>()): Promise<ResolvedDeclaration | undefined> {
    const key = `${file}#${name}`

    if (visited.has(key)) {
      return undefined
    }

    visited.add(key)
    const { syntaxTree } = await readModule(file)
    for (const declaration of syntaxTree.getVariableDeclarations()) {
      const bindingPattern = declaration.getNameNode()

      if (declaration.isExported() && Node.isObjectBindingPattern(bindingPattern)) {
        const element = bindingPattern.getElements().find((element) => element.getName() === name)
        const apiName = element ? await resolveRouterAssetApi(element) : undefined

        if (apiName) {
          return apiName
        }
      }
    }

    const variableDeclaration = syntaxTree.getVariableDeclaration(name)

    if (variableDeclaration?.isExported()) {
      const initializer = variableDeclaration.getInitializer()
      return initializer && Node.isIdentifier(unwrapExpression(initializer)) ? resolveDeclaration(initializer, visited) : variableDeclaration
    }

    if (name === 'default') {
      const defaultExport = syntaxTree.getExportAssignments().at(0)

      if (defaultExport) {
        return Node.isIdentifier(defaultExport.getExpression()) ? resolveDeclaration(defaultExport.getExpression(), visited) : defaultExport
      }
    }

    for (const declaration of syntaxTree.getExportDeclarations()) {
      if (declaration.isTypeOnly()) {
        continue
      }

      const specifier = declaration.getModuleSpecifierValue()
      const importedModulePath = specifier ? await resolveImportPath(specifier, file) : undefined
      const namedExports = declaration.getNamedExports()
      const exportSpecifier = namedExports.find((exportSpecifier) => (exportSpecifier.getAliasNode()?.getText() ?? exportSpecifier.getName()) === name && !exportSpecifier.isTypeOnly())

      if (exportSpecifier) {
        if (specifier === '@kitbag/router') {
          return { api: exportSpecifier.getName() }
        }

        return importedModulePath ? resolveExport(importedModulePath, exportSpecifier.getName(), visited) : resolveDeclaration(exportSpecifier.getNameNode(), visited)
      }

      if (!namedExports.length && importedModulePath) {
        const result = await resolveExport(importedModulePath, name, visited)

        if (result) {
          return result
        }
      }
    }

    return undefined
  }

  async function resolveRouterAssetApi(node: Node): Promise<Api | undefined> {
    if (!Node.isBindingElement(node)) {
      return undefined
    }

    const variableDeclaration = node.getFirstAncestorByKind(SyntaxKind.VariableDeclaration)
    const initializer = variableDeclaration?.getInitializer()

    if (initializer && Node.isCallExpression(initializer) && await isApiCall(initializer, 'createRouterAssets')) {
      return { api: node.getPropertyNameNode()?.getText() ?? node.getName() }
    }

    return undefined
  }

  async function resolveDeclaration(input: Node, visited = new Set<string>()): Promise<ResolvedDeclaration | undefined> {
    const node = unwrapExpression(input)
    const key = `${getSourcePath(node)}:${node.getStart()}`

    if (visited.has(key)) {
      return undefined
    }

    visited.add(key)

    if (Node.isIdentifier(node)) {
      const symbol = node.getSymbol()
      let declaration = symbol?.getDeclarations()[0]

      if (declaration && Node.isShorthandPropertyAssignment(declaration)) {
        declaration = declaration.getValueSymbol()?.getDeclarations()[0]
      }

      if (declaration && Node.isImportSpecifier(declaration)) {
        const importDeclaration = declaration.getImportDeclaration()

        if (importDeclaration.isTypeOnly() || declaration.isTypeOnly()) {
          return undefined
        }

        const specifier = importDeclaration.getModuleSpecifierValue()

        if (specifier === '@kitbag/router' || specifier === 'vue') {
          return { api: declaration.getName() }
        }

        const importedModulePath = await resolveImportPath(specifier, getSourcePath(node))
        return importedModulePath ? resolveExport(importedModulePath, declaration.getName(), visited) : undefined
      }

      if (declaration && Node.isImportClause(declaration)) {
        const importDeclaration = declaration.getParentIfKindOrThrow(SyntaxKind.ImportDeclaration)
        const importedModulePath = await resolveImportPath(importDeclaration.getModuleSpecifierValue(), getSourcePath(node))
        return importedModulePath ? resolveExport(importedModulePath, 'default', visited) : undefined
      }

      if (declaration && Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializer()

        if (initializer && Node.isIdentifier(unwrapExpression(initializer))) {
          return resolveDeclaration(initializer, visited)
        }

        return declaration
      }

      if (declaration && Node.isBindingElement(declaration)) {
        return resolveRouterAssetApi(declaration)
      }

      // A shorthand export's symbol points at the export specifier, not the local declaration.
      const localDeclaration = node.getSourceFile().getVariableDeclaration(node.getText())

      if (localDeclaration) {
        return localDeclaration
      }

      return undefined
    }

    if (Node.isPropertyAccessExpression(node)) {
      const symbol = node.getExpression().getSymbol()
      let declaration = symbol?.getDeclarations()[0]

      if (declaration && Node.isShorthandPropertyAssignment(declaration)) {
        declaration = declaration.getValueSymbol()?.getDeclarations()[0]
      }

      if (declaration && Node.isNamespaceImport(declaration)) {
        const importDeclaration = declaration.getFirstAncestorByKindOrThrow(SyntaxKind.ImportDeclaration)
        const specifier = importDeclaration.getModuleSpecifierValue()

        if (specifier === '@kitbag/router' || specifier === 'vue') {
          return { api: node.getName() }
        }

        const importedModulePath = await resolveImportPath(specifier, getSourcePath(node))
        return importedModulePath ? resolveExport(importedModulePath, node.getName(), visited) : undefined
      }
    }

    return node
  }

  async function isApiCall(call: CallExpression, name: string): Promise<boolean> {
    const resolvedDeclaration = await resolveDeclaration(call.getExpression())
    return resolvedDeclaration !== undefined && 'api' in resolvedDeclaration && resolvedDeclaration.api === name
  }

  async function resolveReusableDefinition(node: Node, apiName: string): Promise<ReusableDefinition | undefined> {
    const resolvedDeclaration = await resolveDeclaration(node)

    if (!resolvedDeclaration || 'api' in resolvedDeclaration) {
      return undefined
    }

    if (!Node.isVariableDeclaration(resolvedDeclaration) && !Node.isExportAssignment(resolvedDeclaration)) {
      return undefined
    }

    const parsedModule = await readModule(getSourcePath(resolvedDeclaration))
    const initializer = Node.isVariableDeclaration(resolvedDeclaration) ? resolvedDeclaration.getInitializer() : resolvedDeclaration.getExpression()
    const statement = Node.isVariableDeclaration(resolvedDeclaration) ? resolvedDeclaration.getVariableStatement() : resolvedDeclaration

    if (!initializer || !Node.isCallExpression(unwrapExpression(initializer)) || statement?.getParent() !== parsedModule.syntaxTree || parsedModule.file.endsWith('.vue')) {
      return undefined
    }

    if (!await isApiCall(unwrapExpression(initializer).asKindOrThrow(SyntaxKind.CallExpression), apiName)) {
      return undefined
    }

    const exportNames = await getExportNames(parsedModule.file)

    for (const name of exportNames) {
      const declaration = await resolveExport(parsedModule.file, name)

      if (declaration === resolvedDeclaration) {
        const options = unwrapExpression(initializer).asKindOrThrow(SyntaxKind.CallExpression)
          .getArguments()
          .at(0)
        const context = getObjectProperty(options, 'context')
        return { id: `${parsedModule.file}#${Node.isVariableDeclaration(resolvedDeclaration) ? resolvedDeclaration.getName() : 'default'}`, file: parsedModule.file, name, ...context ? { context } : {} }
      }
    }

    return undefined
  }

  async function getExportNames(file: string, visited = new Set<string>()): Promise<string[]> {
    if (visited.has(file)) {
      return []
    }

    visited.add(file)
    const { syntaxTree } = await readModule(file)
    const names = syntaxTree.getVariableStatements().filter((statement) => statement.isExported())
      .flatMap((statement) => statement.getDeclarations().map((declaration) => declaration.getName()))

    if (syntaxTree.getExportAssignments().length) {
      names.push('default')
    }

    for (const declaration of syntaxTree.getExportDeclarations()) {
      if (declaration.isTypeOnly()) {
        continue
      }

      const namedExports = declaration.getNamedExports()
      names.push(...namedExports.filter((exportSpecifier) => !exportSpecifier.isTypeOnly()).map((exportSpecifier) => exportSpecifier.getAliasNode()?.getText() ?? exportSpecifier.getName()))

      if (!namedExports.length) {
        const specifier = declaration.getModuleSpecifierValue()
        const importedModulePath = specifier ? await resolveImportPath(specifier, file) : undefined

        if (importedModulePath) {
          names.push(...await getExportNames(importedModulePath, visited))
        } else if (specifier?.startsWith('.')) {
          throw new Error(`Cannot resolve reexport ${specifier} from ${file}`)
        }
      }
    }

    return [...new Set(names)]
  }

  return { resolveExport, resolveDeclaration, isApiCall, resolveReusableDefinition, resolveLoaderDefinition: (node) => resolveReusableDefinition(node, 'createLoader'), getExportNames }
}
