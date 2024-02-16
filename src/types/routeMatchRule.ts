import { Resolved } from '@/types/resolved'

export type RouteMatchRule = (route: Resolved, url: string) => boolean