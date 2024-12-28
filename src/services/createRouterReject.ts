import { Ref, markRaw, ref, Component } from 'vue'
import { genericRejection } from '@/components/rejection'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { createRouteId } from '@/services/createRouteId'
import { isRejectionRouteSymbol } from '@/services/isRejectionRoute'
import { ResolvedRoute } from '@/types/resolved'

export const builtInRejections: ['NotFound'] = ['NotFound']
export type BuiltInRejectionType = typeof builtInRejections[number]

export type RouterSetReject = (type: string | null) => void

type GetRejectionRoute = (type: string) => ResolvedRoute

export type RouterRejection = Ref<null | { type: string, component: Component }>

type CreateRouterRejectContext = {
  rejections?: Partial<Record<string, Component>>,
}

export type CreateRouterReject = {
  setRejection: RouterSetReject,
  rejection: RouterRejection,
  getRejectionRoute: GetRejectionRoute,
}

export function createRouterReject({
  rejections: customRejectionComponents,
}: CreateRouterRejectContext): CreateRouterReject {
  const getRejectionComponent = (type: string): Component => {
    const components = {
      ...customRejectionComponents,
    }

    return markRaw(components[type] ?? genericRejection(type))
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
      name: type,
      query: createResolvedRouteQuery(''),
      params: {},
      state: {},
      href: '/',
      hash: '',
      [isRejectionRouteSymbol]: true,
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
