import { IsOptionalParam } from '@/services/optional'
import { MergeParams } from '@/types/params'
import { Param, ParamGetSet, ParamGetter } from '@/types/paramTypes'
import { Routes } from '@/types/route'
import { RoutesKey, RoutesMap } from '@/types/routesMap'
import { Identity } from '@/types/utilities'
import { MakeOptional } from '@/utilities/makeOptional'

export type RouteGetByKey<TRoutes extends Routes, TKey extends RoutesKey<TRoutes>> = RoutesMap<TRoutes>[TKey]

export type RouteParamsByKey<
  TRoutes extends Routes,
  TKey extends string
> = ExtractRouteParamTypesWithoutLosingOptional<RouteGetByKey<TRoutes, TKey>>

type ExtractRouteParamTypesWithoutLosingOptional<TRoute> = TRoute extends {
  path: { params: infer PathParams extends Record<string, Param> },
  query: { params: infer QueryParams extends Record<string, Param> },
}
  ? ExtractParamTypesWithoutLosingOptional<MergeParams<PathParams, QueryParams>>
  : Record<string, unknown>

type ExtractParamTypesWithoutLosingOptional<TParams extends Record<string, Param>> = Identity<MakeOptional<{
  [K in keyof TParams]: ExtractParamTypeWithoutLosingOptional<TParams[K]>
}>>

type ExtractParamTypeWithoutLosingOptional<TParam extends Param> = TParam extends ParamGetSet<infer Type>
  ? TParam extends IsOptionalParam
    ? Type | undefined
    : Type
  : TParam extends ParamGetter
    ? ReturnType<TParam>
    : string