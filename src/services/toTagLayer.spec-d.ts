import { expectTypeOf, test } from 'vitest'
import { createTags } from '@/services/createTags'
import { toTagLayer } from '@/services/toTagLayer'
import { TagLayer } from '@/types/tags'

test('converts the scoped API to a tag layer', () => {
  const tags = createTags()

  expectTypeOf(toTagLayer(tags)).toEqualTypeOf<TagLayer>()
})
