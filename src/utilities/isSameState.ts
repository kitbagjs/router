export function isSameState(state: Record<string, string | undefined>, other: Record<string, string | undefined>): boolean {
  const keys = Object.keys(state)
  const otherKeys = Object.keys(other)

  return keys.length === otherKeys.length
    && keys.every((key) => Object.hasOwn(other, key) && state[key] === other[key])
}
