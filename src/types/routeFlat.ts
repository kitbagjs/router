import { Param } from '@/types/params'

export type RouteFlat = {
  name: string,
  path: string,
  regex: RegExp,
  params: Record<string, Param[]>,
}