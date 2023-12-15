import { ExtractParamsFromPath } from '@/types'
import { Path } from '@/utilities'

export type RouteFlat = {
  name: string,
  path: string,
  regex: RegExp,
  params: ExtractParamsFromPath<Path>,
}