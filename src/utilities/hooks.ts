import { inject, onUnmounted } from 'vue'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { MaybeArray, RouteMiddleware } from '@/types'
import { asArray } from '@/utilities'
import { RouteHookType, addRouteHookInjectionKey } from '@/utilities/createRouterHooks'
import { RouterRoute } from '@/utilities/createRouterRoute'

/* Desired Hooks
beforeRouteEnter
beforeRouteUpdate
beforeRouteLeave
afterRouteEnter
afterRouteUpdate
afterRouteLeave
*/

type ComponentHookCondition = (to: RouterRoute, from: RouterRoute | null, depth: number) => boolean
type ComponentAddRouteHook = (middleware: MaybeArray<RouteMiddleware>) => void

function factory(type: RouteHookType, condition: ComponentHookCondition): ComponentAddRouteHook {
  return (middleware) => {
    const depth = useRouterDepth()
    const addRouteHook = inject(addRouteHookInjectionKey)

    if (!addRouteHook) {
      throw new RouterNotInstalledError()
    }

    const remove = asArray(middleware).map(fn => {
      const hook: RouteMiddleware = (to, context) => {
        if (!condition(to, context.from, depth)) {
          return
        }

        fn(to, context)
      }

      return addRouteHook(type, hook)
    })

    onUnmounted(() => remove.forEach(fn => fn()))
  }
}

const isComponentEnter: ComponentHookCondition = (to, from, depth) => {
  const toMatches = to.matches
  const fromMatches = from?.matches ?? []

  return toMatches.length < depth || toMatches[depth] !== fromMatches[depth]
}

export const onBeforeRouteEnter = factory('before', isComponentEnter)

const isComponentLeave: ComponentHookCondition = (to, from, depth) => {
  const toMatches = to.matches
  const fromMatches = from?.matches ?? []

  return toMatches.length < depth || toMatches[depth] !== fromMatches[depth]
}

export const onBeforeRouteLeave = factory('before', isComponentLeave)

const isComponentUpdate: ComponentHookCondition = (to, from, depth) => {
  return to.matches[depth] === from?.matches[depth]
}

export const onBeforeRouteUpdate = factory('before', isComponentUpdate)