export function getCaptureGroup(value: string, pattern: RegExp): string[] {
  const matches = Array.from(value.matchAll(pattern))

  return matches.map(([, match]) => match).filter(match => !!match)
}