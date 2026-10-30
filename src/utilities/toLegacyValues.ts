import { DataRecord } from '@/types/data'

export function toLegacyValues(values: DataRecord): Promise<unknown> | DataRecord | undefined {
  // Inspect names without reading descriptors so unused values stay lazy.
  const names = Object.getOwnPropertyNames(values)

  if (names.length === 0) {
    return undefined
  }

  if (names.length === 1 && names[0] === 'default') {
    return values.default
  }

  return values
}
