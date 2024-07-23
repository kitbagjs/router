import { CombineName } from '@/services/combineName'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { CreateRouteOptions } from '@/services/createRoute'
import { Host, ToHost } from '@/types/host'
import { Path, ToPath } from '@/types/path'
import { Query, ToQuery } from '@/types/query'
import { Route } from '@/types/route'


type CreateRouteOptionsWithoutParent<
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined,
  THost extends string | Host | undefined = undefined
> = CreateRouteOptions<TName, TPath, TQuery, THost> & {
  parent?: never,
}

type CreateRouteOptionsWithParent<
  TParent extends Route,
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined,
  THost extends string | Host | undefined = undefined
> = CreateRouteOptions<TName, TPath, TQuery, THost, TParent> & {
  parent: TParent,
}

export function createExternalRoute<
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined,
  THost extends string | Host | undefined = undefined
>(options: CreateRouteOptionsWithoutParent<TName, TPath, TQuery, THost>): Route<TName extends string ? TName : '', ToHost<THost>, ToPath<TPath>, ToQuery<TQuery>>

export function createExternalRoute<
  TParent extends Route,
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined,
  THost extends string | Host | undefined = undefined
>(options: CreateRouteOptionsWithParent<TParent, TName, TPath, TQuery, THost>): Route<CombineName<TParent['key'], TName extends string ? TName : ''>, ToHost<THost>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

export function createExternalRoute(_options: any): Route {
  throw 'not implemented'
}