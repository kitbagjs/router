import { Ref, ref } from 'vue'
import { NotFound } from '@/components'
import { RegisteredRejectionType, Resolved, Route, RouteComponent } from '@/types'

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

export type GetRejectionRoute = (type: RouterRejectionType) => Resolved<Route>
export type ClearRejection = () => void
export type RouterRejection = Ref<null | { type: RouterRejectionType, component: RouteComponent }>

type CreateRouterRejectContext = {
  rejections?: RouterRejectionComponents['rejections'],
}

type CreateRouterReject = {
  reject: RouterReject,
  rejection: RouterRejection,
  clearRejection: ClearRejection,
  getRejectionRoute: GetRejectionRoute,
}

export function createRouterReject({
  rejections: customRejectionComponents,
}: CreateRouterRejectContext): CreateRouterReject {

  const getRejectionComponent = (type: RouterRejectionType): RouteComponent => {
    const components = {
      ...builtInRejectionComponents,
      ...customRejectionComponents,
    }

    return components[type]
  }

  const getRejectionRoute: GetRejectionRoute = (type) => {
    const route = {
      name: type,
      path: '',
      component: getRejectionComponent(type),
    }

    const resolved: Resolved<Route> = {
      matched: route,
      matches: [route],
      name: type,
      depth: 0,
      path: '',
      query: '',
      params: {},
    }

    return resolved
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
    clearRejection,
    getRejectionRoute,
  }
}