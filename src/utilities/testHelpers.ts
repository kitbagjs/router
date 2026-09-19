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

export type StubbedViewTransition = {
  types: string[] | undefined,
  /**
   * Runs the update callback the way the browser would after capturing the old state.
   */
  run: () => Promise<void>,
  /**
   * Skips the transition the way the browser does when another one starts.
   */
  skip: () => void,
}

type ViewTransitionsStub = {
  transitions: StubbedViewTransition[],
  restore: () => void,
}

/**
 * Stands in for document.startViewTransition, which happy-dom lacks, and leaves the test in control of when
 * each callback runs.
 */
export function stubViewTransitions({ types = true }: { types?: boolean } = {}): ViewTransitionsStub {
  const transitions: StubbedViewTransition[] = []
  const previousStart = document.startViewTransition
  const previousCss = Object.getOwnPropertyDescriptor(globalThis, 'CSS')

  // happy-dom exposes CSS through a getter, so it has to be shadowed rather than assigned
  Object.defineProperty(globalThis, 'CSS', {
    value: { supports: () => types },
    configurable: true,
  })

  document.startViewTransition = (callbackOptions) => {
    const options = typeof callbackOptions === 'function' ? { update: callbackOptions } : callbackOptions ?? {}
    const ready: PromiseWithResolvers<void> = Promise.withResolvers()
    const finished: PromiseWithResolvers<void> = Promise.withResolvers()
    const updateCallbackDone: PromiseWithResolvers<void> = Promise.withResolvers()

    const transition: ViewTransition = {
      ready: ready.promise,
      finished: finished.promise,
      updateCallbackDone: updateCallbackDone.promise,
      types: new Set(options.types ?? []),
      skipTransition: () => skip(),
    }

    const run = async (): Promise<void> => {
      try {
        await options.update?.()
        updateCallbackDone.resolve()
        ready.resolve()
        finished.resolve()
      } catch (error) {
        updateCallbackDone.reject(error)
        ready.reject(error)
        finished.reject(error)
      }
    }

    const skip = (): void => {
      ready.reject(new DOMException('Skipped', 'AbortError'))
      finished.resolve()
    }

    transitions.push({ types: options.types ?? undefined, run, skip })

    return transition
  }

  const restore = (): void => {
    document.startViewTransition = previousStart

    if (previousCss) {
      Object.defineProperty(globalThis, 'CSS', previousCss)
    } else {
      Reflect.deleteProperty(globalThis, 'CSS')
    }
  }

  return {
    transitions,
    restore,
  }
}
