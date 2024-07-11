import { DuplicateParamsError } from '@/errors/duplicateParamsError'

export function checkDuplicateKeys(aParams: Record<string, unknown> | string[], bParams: Record<string, unknown> | string[]): void {
  const aParamKeys = Array.isArray(aParams) ? aParams : Object.keys(aParams).map(removeLeadingQuestionMark)
  const bParamKeys = Array.isArray(bParams) ? bParams : Object.keys(bParams).map(removeLeadingQuestionMark)
  const duplicateKey = aParamKeys.find(key => bParamKeys.includes(key))

  if (duplicateKey) {
    throw new DuplicateParamsError(duplicateKey)
  }
}

function removeLeadingQuestionMark(value: string): string {
  if (value.startsWith('?')) {
    return value.slice(1)
  }

  return value
}