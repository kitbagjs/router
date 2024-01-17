import { Param } from '@/types'
import { asArray } from '@/utilities'

export function mergeParams(...paramRecords: Record<string, Param | Param[]>[]): Record<string, Param[]> {
  return paramRecords.reduce<Record<string, Param[]>>((combined, collection) => {
    Object.entries(collection).forEach(([key, params]) => {
      const paramsArray = asArray(params)

      if (key in combined) {
        paramsArray.forEach(param => combined[key].push(param))
      } else {
        combined[key] = [...paramsArray]
      }
    })

    return combined
  }, {})
}