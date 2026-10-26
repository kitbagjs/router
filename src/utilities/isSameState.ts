export function isSameState(state: Record<string, string | undefined>, other: Record<string, string | undefined>): boolean {
  const keys = Object.keys({ ...state, ...other })

  return keys.every((key) => state[key] === other[key])
}
