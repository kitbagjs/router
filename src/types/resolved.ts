import { Param } from '@/types/params'
import { Route } from '@/types/routes'

export type Resolved<T extends Route> = {
  matched: T,
  name: string,
  path: string,
  regex: RegExp,
  parentNames: T['name'][],
  params: Record<string, Param[]>,
}