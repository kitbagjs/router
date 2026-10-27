import { expect, test, vi } from 'vitest'
import { Hooks } from '@/models/hooks'
import { registerHook } from '@/services/registerHook'
import { createHook } from '@/services/createHook'
import { createRoute } from '@/services/createRoute'
import { isHook } from '@/types/hook'
import { toHookCallback } from '@/services/toHookCallback'

test('a collected entry retains the remover for its source array', () => {
  const source = new Hooks()
  const callback = vi.fn()
  const remove = registerHook(source.onBeforeRouteEnter, callback)
  const execution = new Hooks()
  execution.onBeforeRouteEnter.push(...source.onBeforeRouteEnter)

  expect(execution.onBeforeRouteEnter[0]).toBe(source.onBeforeRouteEnter[0])
  remove()
  expect(source.onBeforeRouteEnter).toHaveLength(0)
  expect(execution.onBeforeRouteEnter).toHaveLength(1)
})

test('duplicate callbacks get independent entries and removal functions', () => {
  const source = new Hooks()
  const callback = vi.fn()
  const removeFirst = registerHook(source.onBeforeRouteEnter, callback)
  const first = source.onBeforeRouteEnter[0]
  const removeSecond = registerHook(source.onBeforeRouteEnter, callback)
  const second = source.onBeforeRouteEnter[1]

  expect(first.hook).toBe(callback)
  expect(second.hook).toBe(callback)
  expect(first).not.toBe(second)
  removeSecond()
  expect(source.onBeforeRouteEnter).toEqual([first])
  removeFirst()
  expect(source.onBeforeRouteEnter).toEqual([])
})

test('registration retains the original reusable definition and context', () => {
  const source = new Hooks()
  const target = createRoute({ name: 'target', path: '/target' })
  const callback = vi.fn()
  const hook = createHook({ context: [target], hook: callback })
  registerHook(source.onBeforeRouteEnter, hook)
  const registered = source.onBeforeRouteEnter[0]

  expect(isHook(registered.hook)).toBe(true)
  expect(registered.hook).toBe(hook)
  expect(registered.hook).toMatchObject({ context: hook.context })
  expect(toHookCallback(registered.hook)).toBe(hook.hook)
})

test('removal detaches the signal without affecting a later registration', () => {
  const source = new Hooks()
  const callback = vi.fn()
  const controller = new AbortController()
  const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener')
  const remove = registerHook(source.onBeforeRouteEnter, callback, { signal: controller.signal })

  remove()
  expect(removeEventListener).toHaveBeenCalledExactlyOnceWith('abort', remove)
  registerHook(source.onBeforeRouteEnter, callback)
  controller.abort()
  expect(source.onBeforeRouteEnter).toHaveLength(1)
})

test('an aborted signal skips registration', () => {
  const source = new Hooks()
  const remove = registerHook(source.onBeforeRouteEnter, vi.fn(() => {}), { signal: AbortSignal.abort() })

  remove()
  expect(source.onBeforeRouteEnter).toEqual([])
})
