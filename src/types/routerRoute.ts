import { Param } from '@/types/params'
import { Route } from '@/types/routes'

export type RouterRoute = {
  matched: Route,
  matches: Route[],
  name: string,
  path: string,
  query: string,
  pathParams: Record<string, Param[]>,
  queryParams: Record<string, Param[]>,
  depth: number,
}