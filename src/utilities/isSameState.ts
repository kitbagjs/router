export function isSameState(state: Record<string, unknown>, other: Record<string, unknown>): boolean {
  const keys = Object.keys(state)
  const otherKeys = Object.keys(other)

  return keys.length === otherKeys.length
    && keys.every((key) => Object.hasOwn(other, key) && Object.is(state[key], other[key]))
}
