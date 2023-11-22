import { RouteMethod, ExtractRouteMethodParams } from '../routes'
import { Ref } from 'vue'

export function useRouteParam<
  TRoute extends RouteMethod<any>,
  TParam extends keyof ExtractRouteMethodParams<TRoute>,
  TParamType extends ExtractRouteMethodParams<TRoute>[TParam]
>(_route: TRoute, _param: TParam, _defaultValue?: TParamType): Ref<TParamType> {
  throw 'not implemented'
}