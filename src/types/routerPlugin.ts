import { Component } from "vue";
import { BeforeRouteHook, AfterRouteHook } from "./hooks";
import { Routes } from "./route";
import { MaybeArray } from "./utilities";

export type EmptyRouterPlugin = {
  routes: [],
  rejections: {},
}

export type RouterPlugin<
  TRoutes extends Routes = Routes,
  TRejections extends Record<string, Component> = Record<string, Component>
> = {
  routes: TRoutes,
  rejections: TRejections,
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}
