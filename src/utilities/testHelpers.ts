import { createRoute } from '@/services/createRoute'

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
  name: 'parentA.childA',
  path: '/childA/[?paramB]',
})

const childB = createRoute({
  parent: parentA,
  name: 'parentA.childB',
  path: '/childB/[paramD]',
  component,
})

const grandChild = createRoute({
  parent: childA,
  name: 'parentA.childA.grandChildA',
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
