import { Param } from '@/types/params'
import { Path } from '@/utilities'

export type RouteFlat = {
  name: string,
  path: string | Path,
  regex: RegExp,
  params: Record<string, Param[]>,
}