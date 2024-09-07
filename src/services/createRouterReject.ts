import { Ref, markRaw, ref, Component } from 'vue'
import { genericRejection } from '@/components/rejection'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { RegisteredRejectionType } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'

export const builtInRejections: ['NotFound'] = ['NotFound']
export type BuiltInRejectionType = typeof builtInRejections[number]

export type RouterSetReject = (type: RegisteredRejectionType | null) => void

type GetRejectionRoute = (type: RegisteredRejectionType) => ResolvedRoute
type IsRejectionRoute = (route: ResolvedRoute) => boolean

export type RouterRejection = Ref<null | { type: RegisteredRejectionType, component: Component }>

type CreateRouterRejectContext = {
  rejections?: Partial<Record<string, Component>>,
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

  const getRejectionComponent = (type: RegisteredRejectionType): Component => {
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
      name: type,
      query: createResolvedRouteQuery(''),
      params: {},
      state: {},
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