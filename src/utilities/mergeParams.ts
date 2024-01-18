import { Param } from '@/types'
import { asArray } from '@/utilities'

export function mergeParams(...paramRecords: Record<string, Param | Param[]>[]): Record<string, Param[]> {
  return paramRecords.reduce<Record<string, Param[]>>((combined, collection) => {
    Object.entries(collection).forEach(([key, params]) => {
      if (!(key in combined)) {
        combined[key] = []
      }

      combined[key].push(...asArray(params))
    })

    return combined
  }, {})
}