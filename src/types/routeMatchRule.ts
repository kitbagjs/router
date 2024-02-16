import { ResolvedRoute } from '@/types/resolved'

export type RouteMatchRule = (route: ResolvedRoute, url: string) => boolean