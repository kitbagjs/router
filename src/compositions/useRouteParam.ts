import { Ref } from 'vue'
import { ExtractRouterRouteParamTypes, RouterRoute } from '@/types'

export function useRouteParam<
  TRoute extends RouterRoute,
  TParam extends keyof ExtractRouterRouteParamTypes<TRoute>,
  TParamType = ExtractRouterRouteParamTypes<TRoute>[TParam]
>(_route: TRoute, _param: TParam, _defaultValue?: TParamType): Ref<TParamType> {
  throw 'not implemented'
}