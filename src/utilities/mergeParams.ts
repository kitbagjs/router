import { Param } from '@/types'

export function mergeParams(...paramRecords: Record<string, Param[]>[]): Record<string, Param[]> {
  return paramRecords.reduce<Record<string, Param[]>>((combined, collection) => {
    Object.entries(collection).forEach(([key, params]) => {
      if (key in combined) {
        params.forEach(param => combined[key].push(param))
      } else {
        combined[key] = [...params]
      }
    })

    return combined
  }, {})
}