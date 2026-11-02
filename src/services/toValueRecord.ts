import { markRaw } from 'vue'
import { ValueLocation } from '@/services/getComputations'
import { DataRecord } from '@/types/data'

/** Named promises are read lazily so only requested values subscribe. */
export function toValueRecord(locations: ValueLocation[], read: (location: ValueLocation) => Promise<unknown>): DataRecord {
  const find = (property: string | symbol): ValueLocation | undefined => locations.find(({ name }) => name === property)

  const values: DataRecord = {}

  return markRaw(new Proxy(values, {
    get(target, property) {
      const location = find(property)

      if (location) {
        return read(location)
      }

      return Reflect.get(target, property)
    },
    has(target, property) {
      return Boolean(find(property)) || Reflect.has(target, property)
    },
    ownKeys() {
      return locations.map(({ name }) => name)
    },
    getOwnPropertyDescriptor(target, property) {
      const location = find(property)

      if (!location) {
        return Reflect.getOwnPropertyDescriptor(target, property)
      }

      return {
        configurable: true,
        enumerable: true,
        value: read(location),
      }
    },
  }))
}
