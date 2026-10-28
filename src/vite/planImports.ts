export type ImportRequest = {
  exportName: string,
  moduleSpecifier: string,
}

export type ExistingImport = ImportRequest & { localName: string }

export function createImportPlan(requestedImports: ImportRequest[], reservedNames: Iterable<string> = [], existingImports: ExistingImport[] = []): {
  getImportReference: (exportName: string, moduleSpecifier: string) => string,
  declarations: string[],
} {
  const getImportKey = ({ exportName, moduleSpecifier }: ImportRequest): string => JSON.stringify([moduleSpecifier, exportName])
  const importReferences = new Map(existingImports.map((entry) => [getImportKey(entry), entry.localName]))
  const newImports = [...new Map(requestedImports.map((entry) => [getImportKey(entry), entry])).values()].filter((entry) => !importReferences.has(getImportKey(entry)))
  function getPreferredImportName(entry: ImportRequest): string {
    return entry.exportName === 'default' ? 'defaultImport' : entry.exportName
  }
  const nameOccurrences = new Map<string, number>()
  const occupiedNames = new Set([...reservedNames, ...existingImports.map((entry) => entry.localName)])
  const declarations: string[] = []

  for (const entry of newImports) {
    const exportName = getPreferredImportName(entry)
    nameOccurrences.set(exportName, (nameOccurrences.get(exportName) ?? 0) + 1)
  }

  // Reserve unique names before assigning suffixes to conflicting imports.
  for (const entry of newImports) {
    const exportName = getPreferredImportName(entry)

    if (nameOccurrences.get(exportName) === 1 && !occupiedNames.has(exportName)) {
      importReferences.set(getImportKey(entry), exportName)
      occupiedNames.add(exportName)
    }
  }

  for (const entry of newImports) {
    const exportName = getPreferredImportName(entry)
    let localName = importReferences.get(getImportKey(entry))

    if (!localName) {
      let index = 1
      localName = `${exportName}_${index}`

      while (occupiedNames.has(localName)) {
        localName = `${exportName}_${++index}`
      }

      importReferences.set(getImportKey(entry), localName)
      occupiedNames.add(localName)
    }

    const specifier = JSON.stringify(entry.moduleSpecifier)
    declarations.push(entry.exportName === 'default' ? `import ${localName} from ${specifier}` : `import { ${entry.exportName}${localName === entry.exportName ? '' : ` as ${localName}`} } from ${specifier}`)
  }

  function getImportReference(exportName: string, moduleSpecifier: string): string {
    const localName = importReferences.get(getImportKey({ exportName, moduleSpecifier }))

    if (!localName) {
      throw new Error(`Missing generated import: ${exportName} from ${moduleSpecifier}`)
    }

    return localName
  }

  return { getImportReference, declarations }
}
