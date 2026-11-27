import { expectTypeOf, test } from 'vitest'
import { createRejection } from '@/services/createRejection'

test('status is optional', () => {
  createRejection({ type: 'Unauthorized', status: 401 })

  createRejection({ type: 'Unauthorized' })
})

test('both naming options preserve literal inference', () => {
  const named = createRejection({ name: 'Denied' })
  const legacy = createRejection({ type: 'Denied' })
  expectTypeOf(named.name).toEqualTypeOf<'Denied'>()
  expectTypeOf(legacy.name).toEqualTypeOf<'Denied'>()
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- The alias keeps its literal type.
  expectTypeOf(named.type).toEqualTypeOf<'Denied'>()
  // @ts-expect-error a rejection still requires a name
  createRejection({ status: 403 })
})
