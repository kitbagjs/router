import { Ref } from "vue";
import { ExtractRouteMethodParams, RouteMethod } from "../routes";

type ParamRawValue<T> = Extract<T, undefined> extends never ? string : string | undefined

export function useRouteParamRaw<
  TRoute extends RouteMethod<any>,
  TParam extends keyof ExtractRouteMethodParams<TRoute>,
  TParamType extends ParamRawValue<ExtractRouteMethodParams<TRoute>[TParam]>
>(_route: TRoute, _param: TParam, _defaultValue?: TParamType): Ref<ParamRawValue<TParamType>> {
  throw 'not implemented'
}
