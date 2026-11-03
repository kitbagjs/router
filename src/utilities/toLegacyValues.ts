import { markRaw } from 'vue'
import { ValueLocation } from '@/services/getComputations'
import { DataRecord } from '@/types/data'

export type LegacyValues = Promise<unknown> | DataRecord | undefined

export function toLegacyValues(locations: readonly ValueLocation[], getValue: (location: ValueLocation) => Promise<unknown>): LegacyValues {
  if (locations.length === 0) {
    return undefined
  }

  if (locations.length === 1 && locations[0].name === 'default') {
    return getValue(locations[0])
  }

  const values: DataRecord = {}

  for (const location of locations) {
    Object.defineProperty(values, location.name, {
      enumerable: true,
      get: () => getValue(location),
    })
  }

  return markRaw(values)
}
