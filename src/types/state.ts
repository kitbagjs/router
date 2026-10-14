import { ExtractParamName, ExtractParamType } from '@/types/params'
import { ParamOptions } from '@/types/paramTypes'
import { Routes } from '@/types/route'
import { RouteGetByKey } from '@/types/routeWithParams'
import { MakeOptional } from '@/utilities/makeOptional'
import { Identity } from '@/types/utilities'

export type ToState<TState extends Record<string, ParamOptions> | undefined> = TState extends undefined ? Record<string, ParamOptions> : unknown extends TState ? {} : TState

export type ExtractRouteStateParamsAsOptional<TParamOptions extends Record<string, ParamOptions>> = {
  [K in keyof TParamOptions]: ExtractParamType<TParamOptions[K]> | undefined
}

export type RouteStateByName<
  TRoutes extends Routes,
  TName extends string
> = ExtractStateParams<RouteGetByKey<TRoutes, TName>>

type ExtractStateParams<TRoute> = TRoute extends {
  state: infer TState extends Record<string, ParamOptions>,
}
  ? ExtractParamTypes<TState>
  : Record<string, unknown>

type ExtractParamTypes<TParamOptions extends Record<string, ParamOptions>> = Identity<MakeOptional<{
  [K in keyof TParamOptions as ExtractParamName<K>]: ExtractParamType<TParamOptions[K]>
}>>
