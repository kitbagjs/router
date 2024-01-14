import { ExtractParamsFromPath, MarkOptionalParams, MergeParams } from '@/types/routeMethods'
import { Public, Route, Routes } from '@/types/routes'
import { Identity, UnionToIntersection } from '@/types/utilities'

export type Flattened<
  TRoute extends Route | Routes,
  TPrefix extends string = '',
  TParams extends Record<string, unknown> = Record<never, never>
> = Identity<
TRoute extends Route
  ? RouteFlat<TRoute, TPrefix, TParams> & RouteChildrenFlat<TRoute, TPrefix, TParams>
  : TRoute extends Routes
    ? UnionToIntersection<{
      [K in keyof TRoute]: TRoute[K] extends Route
        ? Flattened<TRoute[K], TPrefix, TParams>
        : Record<never, never>
    }[number]>
    : Record<never, never>
>

type RouteFlat<
  TRoute extends Route,
  TPrefix extends string,
  TParams extends Record<string, unknown> = Record<never, never>
> = TRoute extends Public<TRoute> & { path: infer Path, name: infer Name extends string }
  ? Record<Prefix<Name, TPrefix>, MarkOptionalParams<MergeParams<TParams, ExtractParamsFromPath<Path>>>>
  : Record<never, never>

type RouteChildrenFlat<
  TRoute extends Route,
  TPrefix extends string,
  TParams extends Record<string, unknown> = Record<never, never>
> = TRoute extends { path: infer Path, children: infer Children extends Routes }
  ? TRoute extends Public<TRoute> & { name: infer Name extends string }
    ? Flattened<Children, Prefix<Name, TPrefix>, MergeParams<TParams, ExtractParamsFromPath<Path>>>
    : Flattened<Children, Prefix<'', TPrefix>, MergeParams<TParams, ExtractParamsFromPath<Path>>>
  : Record<never, never>

type Prefix<
  TChildName extends string,
  TParentName extends string
> = `${TChildName}${TParentName}` extends ''
  ? ''
  : TParentName extends ''
    ? TChildName
    : TChildName extends ''
      ? TParentName
      : `${TParentName}.${TChildName}`