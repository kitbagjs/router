import { Param } from '@/types/params'

export type PathParams = Record<string, Param[]>

export type Path<
  T extends string = any,
  P extends PathParams = any
> = {
  path: T,
  params: Required<P>,
}