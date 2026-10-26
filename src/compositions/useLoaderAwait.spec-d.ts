import { expectTypeOf, test } from 'vitest'
import { createLoader, UseLoaderResolved, useLoader } from '@/main'

test('awaiting returns defined loader data without an error ref', async () => {
  const loader = createLoader({ load: async () => ({ name: 'kitbag' }) })
  const result = useLoader(loader)
  expectTypeOf(result.data.value).toEqualTypeOf<{ name: string } | undefined>()
  expectTypeOf(result).toHaveProperty('error')

  const loaded = await result
  expectTypeOf(loaded).toEqualTypeOf<UseLoaderResolved<{ name: string }>>()
  expectTypeOf(loaded.data.value).toEqualTypeOf<{ name: string }>()
  expectTypeOf(loaded).not.toHaveProperty('error')
  expectTypeOf(loaded).not.toHaveProperty('then')
})

test('a loader that returns undefined keeps it in the awaited data type', async () => {
  const loader = createLoader({ load: (): string | undefined => undefined })
  const loaded = await useLoader(loader)
  expectTypeOf(loaded.data.value).toEqualTypeOf<string | undefined>()
})
