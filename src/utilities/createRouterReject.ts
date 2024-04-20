import { Ref, markRaw, ref } from 'vue'
import { NotFound } from '@/components'
import { RegisteredRejectionType, RouteComponent } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { createResolvedRouteQuery } from '@/utilities/createResolvedRouteQuery'

export const builtInRejections = ['NotFound'] as const
export type BuiltInRejectionType = typeof builtInRejections[number]

export const builtInRejectionComponents: Record<BuiltInRejectionType, RouteComponent> = {
  NotFound,
}

export type RouterRejectionType = BuiltInRejectionType | RegisteredRejectionType

type BuiltInRejectionComponents = Partial<Record<BuiltInRejectionType, RouteComponent>>

export type RouterRejectionComponents = RegisteredRejectionType extends never
  ? { rejections?: BuiltInRejectionComponents }
  : { rejections: BuiltInRejectionComponents & Record<RegisteredRejectionType, RouteComponent> }

export type RouterSetReject = (type: RouterRejectionType | null) => void

type GetRejectionRoute = (type: RouterRejectionType) => ResolvedRoute
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
      ...builtInRejectionComponents,
      ...customRejectionComponents,
    }

    return markRaw(components[type])
  }

  const getRejectionRoute: GetRejectionRoute = (type) => {
    const component = markRaw(getRejectionComponent(type))

    const route = {
      name: type,
      path: '',
      component,
    }

    const resolved = {
      matched: route,
      matches: [route],
      key: type,
      query: createResolvedRouteQuery(''),
      params: {},
      [isRejectionRouteSymbol]: true,
    }

    return resolved
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