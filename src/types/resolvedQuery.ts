export type ResolvedRouteQuery = {
  get: (key: string) => string | null,
  getAll: (key: string) => string[],
}
