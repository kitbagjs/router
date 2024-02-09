import { Ref, markRaw, ref } from 'vue'
import { NotFound } from '@/components'
import { RegisteredRejectionType, Resolved, Route, RouteComponent } from '@/types'

export const builtInRejections = ['NotFound'] as const
export type BuiltInRejectionType = typeof builtInRejections[number]

const notFoundRoute = {
  name: Math.random().toString(),
  path: '',
  component: markRaw(NotFound),
}

export const notFoundRouteResolved: Resolved<Route> = {
  matched: notFoundRoute,
  matches: [notFoundRoute],
  name: notFoundRoute.name,
  depth: 0,
  path: '',
  query: '',
  params: {},
}

export const builtInRejectionComponents: Record<BuiltInRejectionType, RouteComponent> = {
  NotFound,
}

export type RouterRejectionType = BuiltInRejectionType | RegisteredRejectionType

type BuiltInRejectionComponents = Partial<Record<BuiltInRejectionType, RouteComponent>>

export type RouterRejectionComponents = RegisteredRejectionType extends never
  ? { rejections?: BuiltInRejectionComponents }
  : { rejections: BuiltInRejectionComponents & Record<RegisteredRejectionType, RouteComponent> }

export type RouterReject = (type: RouterRejectionType) => void

type ClearRejection = () => void
export type RouterRejection = Ref<null | { type: RouterRejectionType, component: RouteComponent }>

type CreateRouterRejectContext = {
  rejections?: RouterRejectionComponents['rejections'],
}

export type CreateRouterReject = {
  reject: RouterReject,
  rejection: RouterRejection,
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
  }
}