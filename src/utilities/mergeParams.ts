import { Param } from '@/types'

export function mergeParams(...params: Record<string, Param[]>[]): Record<string, Param[]> {
  return params.reduce<Record<string, Param[]>>((combined, collection) => {
    Object.entries(collection).forEach(([key, params]) => {
      if (key in combined) {
        params.forEach(param => {
          if (!combined[key].includes(param)) {
            combined[key].push(param)
          }
        })
      } else {
        combined[key] = params
      }
    })

    return combined
  }, {})
}