import { createPath } from 'history'
import { App } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { RoutesKey } from '@/types'
import { Routes } from '@/types/route'
import { Router, RouterOptions, RouterReject } from '@/types/router'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouterReplace, RouterReplaceOptions } from '@/types/routerReplace'
import { Url, isUrl } from '@/types/url'
import { createCurrentRoute } from '@/utilities/createCurrentRoute'
import { createRouterFind } from '@/utilities/createRouterFind'
import { createRouterHistory } from '@/utilities/createRouterHistory'
import { routeHookStoreKey, createRouterHooks } from '@/utilities/createRouterHooks'
import { createRouterReject } from '@/utilities/createRouterReject'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { getInitialUrl } from '@/utilities/getInitialUrl'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'
import { createRouteHookRunners } from '@/utilities/hooks'

type RouterUpdateOptions = {
  replace?: boolean,
}

export function createRouter<const T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const resolve = createRouterResolve(routes)
  const history = createRouterHistory({
    mode: options.historyMode,
    listener: () => {
      const url = createPath(location)

      update(url)
    },
  })

  const { runBeforeRouteHooks, runAfterRouteHooks } = createRouteHookRunners<T>()
  const {
    hooks,
    onBeforeRouteEnter,
    onAfterRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
  } = createRouterHooks()

  async function update(url: string, { replace }: RouterUpdateOptions = {}): Promise<void> {
    history.stopListening()

    const to = getResolvedRouteForUrl(routes, url) ?? getRejectionRoute('NotFound')
    const from = { ...route }

    const beforeResponse = await runBeforeRouteHooks({ to, from, hooks })

    switch (beforeResponse.status) {
      // On abort do nothing
      case 'ABORT':
        return

      // On push update the history, and push new route, and return
      case 'PUSH':
        history.update(url, { replace })
        await push(...beforeResponse.to)
        return

      // On reject update the history, the route, and set the rejection type
      case 'REJECT':
        history.update(url, { replace })
        setRejection(beforeResponse.type)
        updateRoute(to)
        break

      // On success update history, set the route, and clear the rejection
      case 'SUCCESS':
        history.update(url, { replace })
        setRejection(null)
        updateRoute(to)
        break

      default:
        throw new Error(`Switch is not exhaustive for before hook response status: ${JSON.stringify(beforeResponse satisfies never)}`)
    }

    const afterResponse = await runAfterRouteHooks({ to, from, hooks })

    switch (afterResponse.status) {
      case 'PUSH':
        await push(...afterResponse.to)
        break

      case 'REJECT':
        setRejection(afterResponse.type)
        break

      case 'SUCCESS':
        break

      default:
        const exhaustive: never = afterResponse
        throw new Error(`Switch is not exhaustive for after hook response status: ${JSON.stringify(exhaustive)}`)
    }

    history.startListening()
  }

  const push: RouterPush<T> = (source: Url | RoutesKey<T>, paramsOrOptions?: Record<string, unknown> | RouterPushOptions, maybeOptions?: RouterPushOptions) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = { ...paramsOrOptions }
      const url = resolve(source, options)

      return update(url, { replace: options.replace })
    }

    const options: RouterPushOptions = { ...maybeOptions }
    const params: any = paramsOrOptions ?? {}
    const url = resolve(source, params, options)

    return update(url, { replace: options.replace })
  }

  const replace: RouterReplace<T> = (source: Url | RoutesKey<T>, paramsOrOptions?: Record<string, unknown> | RouterReplaceOptions, maybeOptions?: RouterReplaceOptions) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = { ...paramsOrOptions, replace: true }

      return push(source, options)
    }

    const params: any = paramsOrOptions ?? {}
    const options: RouterPushOptions = { ...maybeOptions, replace: true }

    return push(source, params, options)
  }

  const reject: RouterReject = (type) => {
    return setRejection(type)
  }

  const find = createRouterFind(routes)
  const { setRejection, rejection, getRejectionRoute } = createRouterReject(options)
  const notFoundRoute = getRejectionRoute('NotFound')
  const { route, updateRoute } = createCurrentRoute(notFoundRoute)

  history.startListening()

  const initialUrl = getInitialUrl(options.initialUrl)
  const initialized = update(initialUrl, { replace: true })

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerInjectionKey, router)
    app.provide(routerRejectionKey, rejection)
    app.provide(routeHookStoreKey, hooks)
  }

  const router: Router<T> = {
    route,
    resolve,
    push,
    replace,
    reject,
    find,
    refresh: history.refresh,
    forward: history.forward,
    back: history.back,
    go: history.go,
    install,
    initialized,
    onBeforeRouteEnter,
    onAfterRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
  }

  return router
}