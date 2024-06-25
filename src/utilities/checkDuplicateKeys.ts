export function checkDuplicateKeys(aParams: Record<string, unknown>, bParams: Record<string, unknown>): { key: string, hasDuplicates: true } | { key: undefined, hasDuplicates: false } {
  const aParamKeys = Object.keys(aParams).map(removeLeadingQuestionMark)
  const bParamKeys = Object.keys(bParams).map(removeLeadingQuestionMark)
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

function removeLeadingQuestionMark(value: string): string {
  if (value.startsWith('?')) {
    return value.slice(1)
  }

  return value
}