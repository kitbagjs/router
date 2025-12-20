import { RouteUpdate } from '@/types/routeUpdate'
import { ResolvedRoute } from '@/types/resolved'
import { QuerySource } from '@/types/querySource'

export type RouterRoute<TRoute extends ResolvedRoute = ResolvedRoute> = {
  readonly id: TRoute['id'],
  readonly name: TRoute['name'],
  readonly matched: TRoute['matched'],
  readonly matches: TRoute['matches'],
  readonly hooks: TRoute['hooks'],
  readonly hash: TRoute['hash'],
  readonly update: RouteUpdate<TRoute>,
  readonly href: TRoute['href'],

  params: TRoute['params'],
  state: TRoute['state'],

  get query(): URLSearchParams,
  set query(value: QuerySource),
}
