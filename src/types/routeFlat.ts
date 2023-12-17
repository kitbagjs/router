import { PathParams } from '@/types/path'

export type RouteFlat = {
  name: string,
  path: string,
  regex: RegExp,
  params: PathParams,
}