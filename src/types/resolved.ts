import { Param } from '@/types/params'
import { Route } from '@/types/routes'

export const isRejectionSymbol = Symbol()
export const routeDepthSymbol = Symbol()

export type Resolved<T extends Route> = {
  matched: T,
  matches: Route[],
  name: string,
  path: string,
  query: string,
  params: Record<string, Param[]>,
  [routeDepthSymbol]: number,
  [isRejectionSymbol]?: true,
}