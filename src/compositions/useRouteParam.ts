import { Ref } from 'vue'
import { ExtractRouteParamTypes, Route } from '@/types'

export function useRouteParam<
  TRoute extends Route,
  TParam extends keyof ExtractRouteParamTypes<TRoute>,
  TParamType = ExtractRouteParamTypes<TRoute>[TParam]
>(_route: TRoute, _param: TParam, _defaultValue?: TParamType): Ref<TParamType> {
  throw 'not implemented'
}