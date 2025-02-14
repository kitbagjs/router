import { ExtractParamName, ExtractParamType } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Routes } from '@/types/route'
import { RouteGetByKey } from '@/types/routeWithParams'
import { MakeOptional } from '@/utilities/makeOptional'
import { Identity } from '@/types/utilities'

export type ToState<TState extends Record<string, Param> | undefined> = TState extends undefined ? Record<string, Param> : unknown extends TState ? {} : TState

export type ExtractRouteStateParamsAsOptional<TParams extends Record<string, Param>> = {
  [K in keyof TParams]: ExtractParamType<TParams[K]> | undefined
}

export type RouteStateByName<
  TRoutes extends Routes,
  TName extends string
> = ExtractStateParams<RouteGetByKey<TRoutes, TName>>

type ExtractStateParams<TRoute> = TRoute extends {
  state: infer TState extends Record<string, Param>,
}
  ? ExtractParamTypes<TState>
  : Record<string, unknown>

type ExtractParamTypes<TParams extends Record<string, Param>> = Identity<MakeOptional<{
  [K in keyof TParams as ExtractParamName<K>]: ExtractParamType<TParams[K]>
}>>
