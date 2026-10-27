import { expectTypeOf, test } from 'vitest'
import { AnyHook } from '@/types/hook'
import { BeforeEnterHook, AfterEnterHook, ErrorHook, RejectionHook, HookCallback } from '@/types/hooks'
import { RedirectHook } from '@/types/redirects'
import { registerHook } from '@/services/registerHook'
import { Hooks } from '@/models/hooks'
import { createHook } from '@/services/createHook'

test('registration accepts the known callback signatures and reusable definitions', () => {
  const hooks = new Hooks()
  const before: BeforeEnterHook = () => {}
  const after: AfterEnterHook = () => {}
  const error: ErrorHook = () => {}
  const rejection: RejectionHook = () => {}
  const redirect: RedirectHook = () => {}

  registerHook(hooks.onBeforeRouteEnter, before)
  registerHook(hooks.onAfterRouteEnter, after)
  registerHook(hooks.onError, error)
  registerHook(hooks.onRejection, rejection)
  registerHook(hooks.redirects, redirect)
  registerHook(hooks.onBeforeRouteEnter, createHook({ hook: () => {} }))

  expectTypeOf<AnyHook>().not.toExtend<HookCallback>()
  expectTypeOf<BeforeEnterHook>().not.toExtend<AnyHook>()
})
