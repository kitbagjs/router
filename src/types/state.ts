import { ExtractParamTypes } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Routes } from '@/types/route'
import { RouteGetByKey } from '@/types/routeWithParams'

export type ExtractRouteStateParamsAsOptional<T extends Record<string, Param>> = ExtractParamTypes<{
  [K in keyof T as K extends string ? `?${K}` : never]: T[K]
}>

export type RouteStateByName<
  TRoutes extends Routes,
  TName extends string
> = ExtractStateParams<RouteGetByKey<TRoutes, TName>>

type ExtractStateParams<TRoute> = TRoute extends {
  state: infer TState extends Record<string, Param>,
}
  ? ExtractParamTypes<TState>
  : Record<string, unknown>