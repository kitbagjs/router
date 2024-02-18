export type RouterRouteQuery = {
  get: (key: string) => string | null,
  getAll: (key: string) => string[],
}

export function createRouterRouteQuery(query: string): RouterRouteQuery {
  const params = new URLSearchParams(query)

  return {
    get: (key: string) => params.get(key),
    getAll: (key: string) => params.getAll(key),
  }
}