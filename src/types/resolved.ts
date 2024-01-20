import { Param } from '@/types/params'
import { Route } from '@/types/routes'

export type Resolved<T extends Route> = {
  matched: T,
  matches: Route[],
  name: string,
  depth: number,
  path: string,
  query: string,
  params: Record<string, Param[]>,
}