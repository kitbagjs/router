import { Component } from 'vue'
import { Rejection } from '@/types/rejection'
import { ResolvedRoute } from '@/types/resolved'
import { GetTitleCallback } from '@/types/routeTitle'

/**
 * What the router displays. Rendering, assets, and titles share the same interface for every page.
 */
export type Page = {
  assets: ResolvedRoute,
  rejection: Rejection | null,
  status: number,
  getComponent: (depth: number, name: string) => Component | null,
  getTitle: GetTitleCallback,
}
