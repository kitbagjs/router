import { OptionalParam, Param } from '@/types/params'
import { ExtractParamsFromPathString } from '@/types/routeMethods'

export type PathParamsParameter<T extends string = any> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

export type PathParams<
  TPath extends string = any,
  TParams extends PathParamsParameter<TPath> = {}
> = {
  [K in keyof ExtractParamsFromPathString<TPath>]: ExtractParamsFromPathString<TPath>[K] extends unknown[]
    ? MapOverloadedParam<ExtractParamsFromPathString<TPath>[K], TParams[K]>
    : []
}

type ReplaceStringWithConstructor<T> = {
  [K in keyof T]: T[K] extends string
    ? StringConstructor
    : T[K] extends string | undefined
      ? StringConstructor | undefined
      : T[K]
}

type MapOverloadedParam<TParams extends unknown[], TOverload extends OptionalParam> = ReplaceStringWithConstructor<TParams> extends [infer First, ...infer Rest]
  ? [CheckOverloadedParam<First, TOverload>, ...MapOverloadedParam<Rest, TOverload>]
  : []

type CheckOverloadedParam<TTarget, TOverload> = TOverload extends Param
  ? TTarget extends Param
    ? TOverload
    : TOverload | undefined
  : TTarget

export type Path<
  T extends string = any,
  P extends PathParams<T> = any
> = {
  path: T,
  params: P,
}