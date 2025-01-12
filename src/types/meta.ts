import { RouteMeta } from './register'

export type ToMeta<TMeta extends RouteMeta | undefined> = TMeta extends undefined ? {} : unknown extends TMeta ? {} : TMeta
