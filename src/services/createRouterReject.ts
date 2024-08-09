import { Ref, markRaw, ref, Component } from 'vue'
import { genericRejection } from '@/components/rejection'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { RegisteredRejectionType } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'

export const builtInRejections: ['NotFound'] = ['NotFound']
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

const isRejectionRouteSymbol = Symbol()

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
      component,
      meta: {},
      state: {},
    }

    const resolved = {
      matched: route,
      matches: [route],
      key: type,
      query: createResolvedRouteQuery(''),
      params: {},
      state: {},
      stateParams: {},
      [isRejectionRouteSymbol]: true,
    }

    return resolved
  }

  const isRejectionRoute: IsRejectionRoute = (route) => {
    return isRejectionRouteSymbol in route
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