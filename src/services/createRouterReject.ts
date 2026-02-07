import { Ref, markRaw, ref, Component } from 'vue'
import { genericRejection } from '@/components/rejection'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { createRouteId } from '@/services/createRouteId'
import { ResolvedRoute } from '@/types/resolved'
import { Rejection } from '@/types/rejection'
import { Router } from '@/types/router'
import { RouterReject } from '@/types/routerReject'

export type BuiltInRejectionType = 'NotFound'

type RouterSetReject = (type: string | null) => void

type GetRejectionRoute = (type: string) => ResolvedRoute

export type RouterRejection<T extends Rejection = Rejection> = Ref<T | null>
export type RouterRejections<TRouter extends Router> = TRouter['reject'] extends RouterReject<infer TRejections extends Rejection[]> ? TRejections[number] : never

type CreateRouterReject = {
  setRejection: RouterSetReject,
  rejection: RouterRejection,
  getRejectionRoute: GetRejectionRoute,
}

export function createRouterReject(rejections: Rejection[]): CreateRouterReject {
  const getRejectionComponent = (type: string): Component => {
    const rejection = rejections.find((rejection) => rejection.type === type)

    return markRaw(rejection?.component ?? genericRejection(type))
  }

  const getRejectionRoute: GetRejectionRoute = (type) => {
    const component = markRaw(getRejectionComponent(type))

    const route = {
      id: createRouteId(),
      component,
      meta: {},
      state: {},
    }

    return {
      id: route.id,
      matched: route,
      matches: [route],
      hooks: [],
      name: type,
      query: createResolvedRouteQuery(''),
      params: {},
      state: {},
      href: '/',
      hash: '',
    }
  }

  const setRejection: RouterSetReject = (type) => {
    if (!type) {
      rejection.value = null
      return
    }

    const component = getRejectionComponent(type)

    rejection.value = { type, component }
  }

  const rejection: RouterRejection = ref(null)

  return {
    setRejection,
    rejection,
    getRejectionRoute,
  }
}
