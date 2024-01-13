import { Ref } from 'vue'
import { RouteMethod } from '@/types/routeMethod'
import { ExtractRouteMethodParams } from '@/types/routeMethods'

export function useRouteParam<
  TRoute extends RouteMethod,
  TParam extends keyof ExtractRouteMethodParams<TRoute>,
  TParamType extends ExtractRouteMethodParams<TRoute>[TParam]
>(_route: TRoute, _param: TParam, _defaultValue?: TParamType): Ref<TParamType> {
  throw 'not implemented'
}