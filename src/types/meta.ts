import { RouteMeta } from './register'

type EmptyMeta = Readonly<{}>

export type ToMeta<TMeta extends RouteMeta | undefined> = TMeta extends undefined
  ? EmptyMeta
  : unknown extends TMeta
    ? EmptyMeta
    : TMeta
