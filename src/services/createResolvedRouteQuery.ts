import { QuerySource } from '@/types/querySource'

/**
 * Creates a dumb wrapper around URLSearchParams because URLSearchParams cannot be correctly be proxied to support writing params to the RouterRoute
 */
export function createResolvedRouteQuery(query?: QuerySource): URLSearchParams {
  const params = new URLSearchParams(query)

  return {
    get: (...args) => params.get(...args),
    getAll: (...args) => params.getAll(...args),
    set: (...args) => {
      params.set(...args)
    },
    append: (...args) => {
      params.append(...args)
    },
    delete: (...args) => {
      params.delete(...args)
    },
    toString: (...args) => params.toString(...args),
    forEach: (...args) => {
      params.forEach(...args)
    },
    entries: (...args) => params.entries(...args),
    keys: (...args) => params.keys(...args),
    values: (...args) => params.values(...args),
    has: (...args) => params.has(...args),
    size: params.size,
    sort: () => {
      params.sort()
    },
    [Symbol.iterator]: () => params[Symbol.iterator](),
  }
}
