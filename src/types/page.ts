import { Component } from 'vue'
import { Rejection } from '@/types/rejection'
import { ResolvedRoute } from '@/types/resolved'
import { GetTitleCallback } from '@/types/routeTitle'

/**
 * What the router displays. A rejection's private route supplies its assets, while its public route
 * projection is null. Consumers of rendering, assets, and titles do not need to distinguish the source.
 */
export type Page = {
  id: string,
  assets: ResolvedRoute,
  route: ResolvedRoute | null,
  rejection: Rejection | null,
  status: number,
  getComponent: (depth: number, name: string) => Component | null,
  getTitle: GetTitleCallback,
}
