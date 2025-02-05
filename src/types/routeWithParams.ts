import { ZodSchemaLike } from '@/services/zod'
import { ExtractParamName } from '@/types/params'
import { LiteralParam, Param, ParamGetSet, ParamGetter } from '@/types/paramTypes'
import { Routes } from '@/types/route'
import { RoutesName, RoutesMap } from '@/types/routesMap'
import { Identity } from '@/types/utilities'
import { MakeOptional } from '@/utilities/makeOptional'

export type RouteGetByKey<TRoutes extends Routes, TKey extends RoutesName<TRoutes>> = RoutesMap<TRoutes>[TKey]

export type RouteParamsByKey<
  TRoutes extends Routes,
  TKey extends string
> = ExtractRouteParamTypesWithoutLosingOptional<RouteGetByKey<TRoutes, TKey>>

type ExtractRouteParamTypesWithoutLosingOptional<TRoute> = TRoute extends {
  host: { params: infer HostParams extends Record<string, Param> },
  path: { params: infer PathParams extends Record<string, Param> },
  query: { params: infer QueryParams extends Record<string, Param> },
  hash: { params: infer HashParams extends Record<string, Param> },
}
  ? ExtractParamTypesWithoutLosingOptional<HostParams & PathParams & QueryParams & HashParams>
  : Record<string, unknown>

type ExtractParamTypesWithoutLosingOptional<TParams extends Record<string, Param>> = Identity<MakeOptional<{
  [K in keyof TParams as ExtractParamName<K>]: ExtractParamTypeWithoutLosingOptional<TParams[K], K>
}>>

export type ExtractParamTypeWithoutLosingOptional<TParam extends Param, TParamKey extends PropertyKey> =
  TParam extends ParamGetSet<infer Type>
    ? TParamKey extends `?${string}`
      ? Type | undefined
      : Type
    : TParam extends ParamGetter
      ? TParamKey extends `?${string}`
        ? ReturnType<TParam> | undefined
        : ReturnType<TParam>
      : TParam extends ZodSchemaLike<infer Type>
        ? TParamKey extends `?${string}`
          ? Type | undefined
          : Type
        : TParam extends LiteralParam
          ? TParamKey extends `?${string}`
            ? TParam | undefined
            : TParam
          : TParamKey extends `?${string}`
            ? string | undefined
            : string
