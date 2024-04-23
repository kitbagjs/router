import { Ref, markRaw, ref } from 'vue'
import { genericRejection } from '@/components/rejection'
import { RegisteredRejectionType, RouteComponent } from '@/types'
import { ResolvedRoute, ResolvedRouteSource } from '@/types/resolved'
import { createResolvedRouteQuery } from '@/utilities/createResolvedRouteQuery'

export const builtInRejections = ['NotFound'] as const
export type BuiltInRejectionType = typeof builtInRejections[number]

export type RouterRejectionType = BuiltInRejectionType | RegisteredRejectionType

export type RouterRejectionComponents = { rejections?: Partial<Record<RouterRejectionType, RouteComponent>> }

export type RouterSetReject = (type: RouterRejectionType | null) => void

type GetRejectionRoute = (type: RouterRejectionType) => ResolvedRouteSource
type IsRejectionRoute = (route: ResolvedRoute) => boolean

export type RouterRejection = Ref<null | { type: RouterRejectionType, component: RouteComponent }>

type CreateRouterRejectContext = {
  rejections?: RouterRejectionComponents['rejections'],
}

const isRejectionRouteSymbol = Symbol()

type RouterRejectionRoute = ResolvedRoute & { [isRejectionRouteSymbol]?: true }

export type CreateRouterReject = {
  setRejection: RouterSetReject,
  rejection: RouterRejection,
  getRejectionRoute: GetRejectionRoute,
  isRejectionRoute: IsRejectionRoute,
}

export function createRouterReject({
  rejections: customRejectionComponents,
}: CreateRouterRejectContext): CreateRouterReject {

  const getRejectionComponent = (type: RouterRejectionType): RouteComponent => {
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
    }

    return {
      matched: route,
      matches: [route],
      key: type,
      query: createResolvedRouteQuery(''),
      params: {},
      [isRejectionRouteSymbol]: true,
    }
  }

  const isRejectionRoute: IsRejectionRoute = (route: RouterRejectionRoute) => {
    return route[isRejectionRouteSymbol] === true
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