import { DuplicateParamsError } from '@/errors/duplicateParamsError'

export function checkDuplicateKeys(...withParams: (Record<string, unknown> | string[])[]): void {
  const paramKeys = withParams.flatMap(params => Array.isArray(params) ? params : Object.keys(params).map(removeLeadingQuestionMark))

  for (const key of paramKeys) {
    if (getCount(paramKeys, key) > 1) {
      throw new DuplicateParamsError(key)
    }
  }
}

function getCount<T>(array: T[], item: T): number {
  return array.filter(itemAtIndex => item === itemAtIndex).length
}

function removeLeadingQuestionMark(value: string): string {
  if (value.startsWith('?')) {
    return value.slice(1)
  }

  return value
}