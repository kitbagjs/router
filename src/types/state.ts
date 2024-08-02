import { ExtractParamTypes } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Routes } from '@/types/route'
import { RouteGetByKey } from '@/types/routeWithParams'

export type ExtractRouteStateParamsAsOptional<T extends Record<string, Param>> = ExtractParamTypes<{
  [K in keyof T as K extends string ? `?${K}` : never]: T[K]
}>

export type RouteStateByKey<
  TRoutes extends Routes,
  TKey extends string
> = ExtractStateParams<RouteGetByKey<TRoutes, TKey>>

type ExtractStateParams<TRoute> = TRoute extends {
  state: infer TState extends Record<string, Param>,
}
  ? ExtractParamTypes<TState>
  : Record<string, unknown>