import { Ref, markRaw, ref, Component } from 'vue'
import { genericRejection } from '@/components/rejection'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { RegisteredRejectionType } from '@/types'
import { ResolvedRoute } from '@/types/resolved'

export const builtInRejections = ['NotFound'] as const
export type BuiltInRejectionType = typeof builtInRejections[number]

export type RouterRejectionType = BuiltInRejectionType | RegisteredRejectionType

export type RouterRejectionComponents = { rejections?: Partial<Record<RouterRejectionType, Component>> }

export type RouterSetReject = (type: RouterRejectionType | null) => void

type GetRejectionRoute = (type: RouterRejectionType) => ResolvedRoute
type IsRejectionRoute = (route: ResolvedRoute) => boolean

export type RouterRejection = Ref<null | { type: RouterRejectionType, component: Component }>

type CreateRouterRejectContext = {
  rejections?: RouterRejectionComponents['rejections'],
}

type RouterRejectionRoute = ResolvedRoute & { __isRejectionRoute?: true }

export type CreateRouterReject = {
  setRejection: RouterSetReject,
  rejection: RouterRejection,
  getRejectionRoute: GetRejectionRoute,
  isRejectionRoute: IsRejectionRoute,
}

export function createRouterReject({
  rejections: customRejectionComponents,
}: CreateRouterRejectContext): CreateRouterReject {

  const getRejectionComponent = (type: RouterRejectionType): Component => {
    const components = {
      ...customRejectionComponents,
    }

    return markRaw(components[type] ?? genericRejection(type))
  }

  const getRejectionRoute: GetRejectionRoute = (type) => {
    const component = markRaw(getRejectionComponent(type))

    const route = {
      name: type,
      path: '',
      component,
      meta: {},
    }

    const resolved = {
      matched: route,
      matches: [route],
      key: type,
      query: createResolvedRouteQuery(''),
      params: {},
      __isRejectionRoute: true,
    }

    return resolved
  }

  const isRejectionRoute: IsRejectionRoute = (route: RouterRejectionRoute) => {
    return route.__isRejectionRoute === true
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
    isRejectionRoute,
  }
}