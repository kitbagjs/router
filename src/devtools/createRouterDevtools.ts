import { setupDevtoolsPlugin } from '@vue/devtools-api'
import { App, watch } from 'vue'
import { Router } from '@/types/router'
import { Routes, Route } from '@/types/route'
import { createUniqueIdSequence } from '@/services/createUniqueIdSequence'
import { isBrowser } from '@/utilities'
import { getDevtoolsLabel } from './getDevtoolsLabel'

// Support multiple router instances
const getRouterId = createUniqueIdSequence()

// Colors for route tags
const CYAN_400 = 0x22d3ee
const GREEN_500 = 0x22c55e
const GREEN_600 = 0x16a34a

// Extract types from DevTools API by inferring from the callback parameter
type ExtractAPIFromCallback = Parameters<Parameters<typeof setupDevtoolsPlugin>[1]>[0]
type ExtractInspectorTreeHandler = Parameters<ExtractAPIFromCallback['on']['getInspectorTree']>[0]
type ExtractInspectorStateHandler = Parameters<ExtractAPIFromCallback['on']['getInspectorState']>[0]
type ExtractInspectorTreePayload = Parameters<ExtractInspectorTreeHandler>[0]
type ExtractInspectorStatePayload = Parameters<ExtractInspectorStateHandler>[0]

// Type definitions for the inspector
type CustomInspectorNode = ExtractInspectorTreePayload['rootNodes'][number]
type InspectorNodeTag = NonNullable<CustomInspectorNode['tags']>[number]
type CustomInspectorState = ExtractInspectorStatePayload['state']

type RouteMatchOptions = {
  match: boolean,
  exactMatch: boolean,
}

/**
 * Formats a route for the inspector tree.
 */
function getInspectorNodeForRoute(
  route: Route,
  options: RouteMatchOptions = { match: false, exactMatch: false },
): CustomInspectorNode {
  const tags: InspectorNodeTag[] = []

  // Add route name tag
  if (route.name) {
    tags.push({
      label: route.name,
      textColor: 0,
      backgroundColor: CYAN_400,
    })
  }

  if (options.match) {
    tags.push({
      label: 'match',
      textColor: 0,
      backgroundColor: GREEN_500,
    })
  }

  if (options.exactMatch) {
    tags.push({
      label: 'exact-match',
      textColor: 0,
      backgroundColor: GREEN_600,
    })
  }

  return {
    id: route.id,
    label: route.path.value || route.name,
    tags,
  }
}

/**
 * Calculates match status for a route based on the current route.
 */
function getRouteMatchStatus(
  route: Route,
  currentRoute: Router['route'] | undefined,
): RouteMatchOptions {
  if (!currentRoute || !('id' in currentRoute) || !('matches' in currentRoute)) {
    return { match: false, exactMatch: false }
  }

  const exactMatch = currentRoute.id === route.id
  const match = currentRoute.matches.some((match: { id: string }) => match.id === route.id)

  return { match, exactMatch }
}

/**
 * Formats a Route definition for the inspector.
 * Shows the route definition properties (path pattern, name, meta, etc.)
 */
function getIspectorStateOptionsForRoute(route: Route): CustomInspectorState[string] {
  const fields: CustomInspectorState[string] = []

  // Route name
  fields.push({
    editable: false,
    key: 'name',
    value: route.name,
  })

  // Route path pattern
  fields.push({
    editable: false,
    key: 'path',
    value: route.path.value,
  })

  // Route query
  fields.push({
    editable: false,
    key: 'query',
    value: route.query.value,
  })

  // Route hash
  fields.push({
    editable: false,
    key: 'hash',
    value: route.hash.value,
  })

  // Route meta
  fields.push({
    editable: false,
    key: 'meta',
    value: route.meta,
  })

  return fields
}

type RouterDevtoolsProps = {
  router: Router,
  app: App,
  routes: Routes,
}

/**
 * Sets up Vue DevTools integration for Kitbag Router.
 */
export function setupRouterDevtools({ router, app, routes: routesArray }: RouterDevtoolsProps): void {
  if (!isBrowser()) {
    return
  }

  // Prevent double registration
  if (router.hasDevtools) {
    return
  }

  router.hasDevtools = true

  // Support multiple router instances
  const id = getRouterId()
  const routesMap = new Map(routesArray.map((route) => [route.id, route]))
  const routerInspectorId = `kitbag-router-routes.${id}` as const
  const pluginId = `kitbag-router.${id}` as const

  setupDevtoolsPlugin(
    {
      id: pluginId,
      label: 'Kitbag Router',
      packageName: '@kitbag/router',
      homepage: 'https://router.kitbag.dev/',
      componentStateTypes: ['Routing'],
      logo: 'https://kitbag.dev/kitbag-logo-circle.svg',
      app,
    },
    (api) => {
      // Add inspector for routes
      api.addInspector({
        id: routerInspectorId,
        label: getDevtoolsLabel('Routes', id),
        treeFilterPlaceholder: 'Search routes',
      })

      // Handle inspector tree (list of routes)
      api.on.getInspectorTree((payload) => {
        if (payload.app !== app || payload.inspectorId !== routerInspectorId) {
          return
        }

        // Filter routes that have names
        const namedRoutes = routesArray.filter((route) => route.name)

        // Format routes for inspector with match status
        payload.rootNodes = namedRoutes.map((route) => {
          const matchStatus = getRouteMatchStatus(route, router.route)

          return getInspectorNodeForRoute(route, matchStatus)
        })
      })

      // Watch router.route and update inspector tree reactively
      watch(
        () => router.route,
        () => {
          // Send updated tree to devtools (this will trigger getInspectorTree handler)
          api.sendInspectorTree(routerInspectorId)
        },
        { deep: true, immediate: false },
      )

      // Handle inspector state (individual route details)
      api.on.getInspectorState((payload) => {
        if (payload.app !== app || payload.inspectorId !== routerInspectorId) {
          return
        }

        // Find route by ID
        const route = routesMap.get(payload.nodeId)

        if (!route) {
          return
        }

        payload.state = {
          options: getIspectorStateOptionsForRoute(route),
        }
      })

      // Initial refresh
      api.sendInspectorTree(routerInspectorId)
      api.sendInspectorState(routerInspectorId)
    },
  )
}
