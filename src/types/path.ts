import { Param } from '@/types/params'
import { ExtractParamsFromPathString } from '@/types/routeMethods'

export type PathParamsParameter<T extends string> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

export type PathParams<
  TPath extends string = any,
  TParams extends PathParamsParameter<TPath> = any
> = {
  [K in keyof ExtractParamsFromPathString<TPath>]: TParams[K] extends Param ? [TParams[K]] : [StringConstructor]
}

export type Path<
  T extends string = any,
  P extends PathParams<T> = any
> = {
  path: T,
  params: P,
}