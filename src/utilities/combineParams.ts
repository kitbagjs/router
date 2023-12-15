import { PathParams } from '@/types'

export function combineParams(...params: PathParams[]): PathParams {
  return params.reduce<PathParams>((combined, collection) => {
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