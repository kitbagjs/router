import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { NodeTypes } from '@vue/compiler-dom'
import { Project, ScriptKind, ts } from 'ts-morph'
import type { ParsedModule } from './types'

export function createModuleReader(): (filePath: string) => Promise<ParsedModule> {
  const project = new Project({ useInMemoryFileSystem: true })

  return async (filePath) => {
    const sourceText = await readFile(filePath, 'utf8')
    const templateTags = new Set<string>()
    let scriptText = sourceText
    let setupRange: ParsedModule['setupRange']

    if (filePath.endsWith('.vue')) {
      const { descriptor, errors } = parse(sourceText, { filename: filePath })

      if (errors.length) {
        throw new Error(`Cannot parse ${filePath}: ${String(errors[0])}`)
      }

      // Keep script offsets aligned with the SFC so diagnostics point to authored lines.
      scriptText = sourceText.replace(/[^\r\n]/g, ' ')

      for (const scriptBlock of [descriptor.script, descriptor.scriptSetup]) {
        if (!scriptBlock) {
          continue
        }

        if (scriptBlock.src) {
          throw new Error(`External SFC scripts are not supported: ${filePath}`)
        }

        scriptText = scriptText.slice(0, scriptBlock.loc.start.offset) + scriptBlock.content + scriptText.slice(scriptBlock.loc.end.offset)
      }

      if (descriptor.scriptSetup) {
        setupRange = {
          start: descriptor.scriptSetup.loc.start.offset,
          end: descriptor.scriptSetup.loc.end.offset,
        }
      }

      function collectTemplateTags(node: { type: NodeTypes, tag?: string, children?: unknown[] }): void {
        if (node.type === NodeTypes.ELEMENT && node.tag) {
          templateTags.add(node.tag)
        }

        for (const child of node.children ?? []) {
          collectTemplateTags(child as Parameters<typeof collectTemplateTags>[0])
        }
      }

      if (descriptor.template?.ast) {
        collectTemplateTags(descriptor.template.ast)
      }
    }

    const syntaxTree = project.createSourceFile(filePath.endsWith('.vue') ? `${filePath}.ts` : filePath, scriptText, {
      scriptKind: ScriptKind.TS,
      overwrite: true,
    })

    const diagnostics = project.getProgram().compilerObject.getSyntacticDiagnostics(syntaxTree.compilerNode)

    if (diagnostics.length) {
      throw new Error(`Cannot parse ${filePath}: ${ts.flattenDiagnosticMessageText(diagnostics[0].messageText, '\n')}`)
    }

    return { file: filePath, sourceText, syntaxTree, templateTags, setupRange }
  }
}

export async function resolveRelativeImportPath(specifier: string, importer: string): Promise<string | undefined> {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return undefined
  }

  const importPath = resolve(dirname(importer), specifier)
  const candidatePaths = ['.ts', '.tsx', '.js', '.vue'].includes(extname(importPath)) ? [importPath] : [importPath, `${importPath}.ts`, `${importPath}.tsx`, `${importPath}.js`, `${importPath}.vue`, `${importPath}/index.ts`]

  for (const candidatePath of candidatePaths) {
    const fileStats = await stat(candidatePath).catch(() => undefined)

    if (fileStats?.isFile()) {
      return candidatePath
    }
  }

  return undefined
}
