import { Ref, ref } from 'vue'
import { NotFound } from '@/components'
import { RegisteredRejection, Resolved, Route, RouteComponent } from '@/types'

export const builtInRejections = ['NotFound'] as const
export type BuiltInRejection = typeof builtInRejections[number]

export const builtInRejectionComponents: Record<BuiltInRejection, RouteComponent> = {
  NotFound,
}

export type RouterRejection = BuiltInRejection | RegisteredRejection

type BuiltInRejectionComponents = Partial<Record<BuiltInRejection, RouteComponent>>

export type RouterRejectionComponents = RegisteredRejection extends never
  ? { rejections?: BuiltInRejectionComponents }
  : { rejections: BuiltInRejectionComponents & Record<RegisteredRejection, RouteComponent> }

export type RouterReject = (type: RouterRejection) => void

type GetRejectionComponent = (type: RouterRejection) => RouteComponent
type GetRejectionRoute = (type: RouterRejection) => Resolved<Route>
type ClearRejection = () => void
export type RouterRejectionComponent = Ref<null | { type: RouterRejection, component: RouteComponent }>

type CreateRouterRejectContext = {
  rejections?: RouterRejectionComponents['rejections'],
}

type CreateRouterReject = {
  reject: RouterReject,
  rejection: RouterRejectionComponent,
  clearRejection: ClearRejection,
  getRejectionRoute: GetRejectionRoute,
  getRejectionComponent: GetRejectionComponent,
}

export function createRouterReject({
  rejections: customRejectionComponents,
}: CreateRouterRejectContext): CreateRouterReject {

  const getRejectionComponent: GetRejectionComponent = (type) => {
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

  const rejection: RouterRejectionComponent = ref(null)

  return {
    reject,
    rejection,
    clearRejection,
    getRejectionRoute,
    getRejectionComponent,
  }
}