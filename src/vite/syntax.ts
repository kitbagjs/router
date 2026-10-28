import { Node, SyntaxKind } from 'ts-morph'

export function getSourcePath(node: Node): string {
  return node.getSourceFile().getFilePath()
    .replace(/\.vue\.ts$/, '.vue')
}

export function unwrapExpression(node: Node): Node {
  if (Node.isAsExpression(node) || Node.isSatisfiesExpression(node) || Node.isParenthesizedExpression(node) || Node.isNonNullExpression(node)) {
    return unwrapExpression(node.getExpression())
  }

  return node
}

export function getObjectProperty(node: Node | undefined, name: string): Node | undefined {
  if (!node || !Node.isObjectLiteralExpression(unwrapExpression(node))) {
    return undefined
  }

  const entry = unwrapExpression(node).asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    .getProperty(name)

  if (entry && Node.isPropertyAssignment(entry)) {
    return entry.getInitializer()
  }

  if (entry && Node.isShorthandPropertyAssignment(entry)) {
    return entry.getNameNode()
  }

  return undefined
}

export function normalizeComponentTag(name: string): string {
  return name.replace(/-/g, '').toLowerCase()
}
