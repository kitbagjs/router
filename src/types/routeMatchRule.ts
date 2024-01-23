import { Resolved } from '@/types/resolved'
import { Route } from '@/types/routes'

export type RouteMatchRule = (route: Resolved<Route>, url: string) => boolean