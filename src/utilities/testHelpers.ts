import { vi } from 'vitest'
import { path } from '@/services'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { createRoute } from '@/services/createRoute'
import { ResolvedRoute } from '@/types/resolved'
import { CreateRouteOptionsWithMeta } from '@/types/route'

export const random = {
  number(options: { min?: number, max?: number } = {}): number {
    const { min, max } = { min: 0, max: 1, ...options }
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min

    return randomNumber
  },
}

export function getError(callback: () => any): unknown {
  try {
    callback()
  } catch (error) {
    return error
  }

  throw new Error('callback given to getError ran without throwing an error')
}

export const component = { template: '<div>This is component</div>' }

const parentA = createRoute({
  name: 'parentA',
  path: '/parentA/[paramA]',
})

const childA = createRoute({
  parent: parentA,
  name: 'childA',
  path: '/[?paramB]',
})

const childB = createRoute({
  parent: parentA,
  name: 'childB',
  path: '/[paramD]',
  component,
})

const grandChild = createRoute({
  parent: childA,
  name: 'grandChildA',
  path: '/[paramC]',
  component,
})

export const routes = [
  parentA,
  childA,
  childB,
  grandChild,
  createRoute({
    name: 'parentB',
    path: '/parentB',
    component,
  }),
  createRoute({
    name: 'parentC',
    path: '/',
    component,
  }),
] as const

export function mockRoute<TName extends string>(name: TName): CreateRouteOptionsWithMeta {
  return {
    name,
    path: path(`/${name}`, {}),
    component,
    onBeforeRouteEnter: vi.fn(),
    onBeforeRouteUpdate: vi.fn(),
    onBeforeRouteLeave: vi.fn(),
    meta: {},
  }
}

export function mockResolvedRoute(matched: CreateRouteOptionsWithMeta, matches: CreateRouteOptionsWithMeta[]): ResolvedRoute {
  return {
    matched,
    matches,
    key: matched.name!,
    query: createResolvedRouteQuery(),
    params: {},
  }
}