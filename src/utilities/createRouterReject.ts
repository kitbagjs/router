import { Ref, markRaw, ref } from 'vue'
import { NotFound } from '@/components'
import { RegisteredRejectionType, RouteComponent } from '@/types'
import { RouterRoute } from '@/utilities/createRouterRoute'
import { createRouterRouteQuery } from '@/utilities/createRouterRouteQuery'

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

export type RouterReject = (type: RouterRejectionType) => void

type GetRejectionRoute = (type: RouterRejectionType) => RouterRoute
type IsRejectionRoute = (route: RouterRoute) => boolean
type ClearRejection = () => void
export type RouterRejection = Ref<null | { type: RouterRejectionType, component: RouteComponent }>

type CreateRouterRejectContext = {
  rejections?: RouterRejectionComponents['rejections'],
}

const isRejectionRouteSymbol = Symbol()

type RouterRejectionRoute = RouterRoute & { [isRejectionRouteSymbol]?: true }

export type CreateRouterReject = {
  reject: RouterReject,
  rejection: RouterRejection,
  getRejectionRoute: GetRejectionRoute,
  isRejectionRoute: IsRejectionRoute,
  clearRejection: ClearRejection,
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
      name: type,
      query: createRouterRouteQuery(''),
      params: {},
      [isRejectionRouteSymbol]: true,
    }

    return resolved
  }

  const isRejectionRoute: IsRejectionRoute = (route: RouterRejectionRoute) => {
    return route[isRejectionRouteSymbol] === true
  }

  const clearRejection: ClearRejection = () => {
    rejection.value = null
  }

  const reject: RouterReject = (type) => {
    const component = getRejectionComponent(type)

    rejection.value = { type, component }
  }

  const rejection: RouterRejection = ref(null)

  return {
    reject,
    rejection,
    getRejectionRoute,
    isRejectionRoute,
    clearRejection,
  }
}