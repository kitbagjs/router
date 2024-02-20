import { asArray } from '@/utilities'

export function mergeMaybeTuples<T>(...records: Record<string, T | T[]>[]): Record<string, T[]> {
  return records.reduce<Record<string, T[]>>((combined, record) => {
    Object.entries(record).forEach(([key, value]) => {
      if (!(key in combined)) {
        combined[key] = []
      }

      combined[key].push(...asArray(value))
    })

    return combined
  }, {})
}