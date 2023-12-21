import { Param } from '@/types/params'
import { Route } from '@/types/routes'

export type Resolved<T extends Route> = T & {
  name: string,
  path: string,
  regex: RegExp,
  params: Record<string, Param[]>,
}