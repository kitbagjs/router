import { RouteHooks } from '@/models/RouteHooks'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from '@/services/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { asArray } from '@/utilities/array'

/**
 * @deprecated will be removed in a future version
 */
export function getBeforeRouteHooksFromRoutesDeprecated(to: ResolvedRoute, from: ResolvedRoute | null): RouteHooks {
  const hooks = new RouteHooks()

  to.matches.forEach((route, depth) => {
    if (route.onBeforeRouteEnter && isRouteEnter(to, from, depth)) {
      asArray(route.onBeforeRouteEnter).forEach((hook) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[vue-router] onBeforeRouteEnter is deprecated. Use router.onBeforeRouteEnter instead')
        }
        hooks.onBeforeRouteEnter.add(hook)
      })
    }

    if (route.onBeforeRouteUpdate && isRouteUpdate(to, from, depth)) {
      asArray(route.onBeforeRouteUpdate).forEach((hook) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[vue-router] onBeforeRouteUpdate is deprecated. Use router.onBeforeRouteUpdate instead')
        }
        hooks.onBeforeRouteUpdate.add(hook)
      })
    }
  })

  from?.matches.forEach((route, depth) => {
    if (route.onBeforeRouteLeave && isRouteLeave(to, from, depth)) {
      asArray(route.onBeforeRouteLeave).forEach((hook) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[vue-router] onBeforeRouteLeave is deprecated. Use router.onBeforeRouteLeave instead')
        }
        hooks.onBeforeRouteLeave.add(hook)
      })
    }
  })

  return hooks
}

/**
 * @deprecated will be removed in a future version
 */
export function getAfterRouteHooksFromRoutesDeprecated(to: ResolvedRoute, from: ResolvedRoute | null): RouteHooks {
  const hooks = new RouteHooks()

  to.matches.forEach((route, depth) => {
    if (route.onAfterRouteEnter && isRouteEnter(to, from, depth)) {
      asArray(route.onAfterRouteEnter).forEach((hook) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[vue-router] onAfterRouteEnter is deprecated. Use router.onAfterRouteEnter instead')
        }
        hooks.onAfterRouteEnter.add(hook)
      })
    }

    if (route.onAfterRouteUpdate && isRouteUpdate(to, from, depth)) {
      asArray(route.onAfterRouteUpdate).forEach((hook) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[vue-router] onAfterRouteUpdate is deprecated. Use router.onAfterRouteUpdate instead')
        }
        hooks.onAfterRouteUpdate.add(hook)
      })
    }
  })

  from?.matches.forEach((route, depth) => {
    if (route.onAfterRouteLeave && isRouteLeave(to, from, depth)) {
      asArray(route.onAfterRouteLeave).forEach((hook) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[vue-router] onAfterRouteLeave is deprecated. Use router.onAfterRouteLeave instead')
        }
        hooks.onAfterRouteLeave.add(hook)
      })
    }
  })

  return hooks
}
