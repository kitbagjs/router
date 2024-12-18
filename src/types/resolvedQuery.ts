export const isResolvedRouteQuerySymbol = Symbol('isResolvedRouteQuerySymbol')

export type ResolvedRouteQuery = {
  append: URLSearchParams['append'],
  delete: URLSearchParams['delete'],
  entries: URLSearchParams['entries'],
  forEach: URLSearchParams['forEach'],
  get: URLSearchParams['get'],
  getAll: URLSearchParams['getAll'],
  has: URLSearchParams['has'],
  keys: URLSearchParams['keys'],
  set: URLSearchParams['set'],
  toString: URLSearchParams['toString'],
  values: URLSearchParams['values'],
  [isResolvedRouteQuerySymbol]: true,
}

export function isResolvedRouteQuery(value: unknown): value is ResolvedRouteQuery {
  return typeof value === 'object' && value !== null && isResolvedRouteQuerySymbol in value
}
