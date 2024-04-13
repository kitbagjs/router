export function checkDuplicateKeys(aParams: Record<string, unknown>, bParams: Record<string, unknown>): { key: string, hasDuplicates: true } | { key: undefined, hasDuplicates: false } {
  const aParamKeys = Object.keys(aParams)
  const bParamKeys = Object.keys(bParams)
  const duplicateKey = aParamKeys.find(key => bParamKeys.includes(key))

  if (duplicateKey) {
    return {
      key: duplicateKey,
      hasDuplicates: true,
    }
  }

  return {
    key: undefined,
    hasDuplicates: false,
  }
}