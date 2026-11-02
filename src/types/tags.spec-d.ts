import { expectTypeOf, test } from 'vitest'
import type { LinkBase, Meta } from 'zhead'
import { LinkTag, MetaTag, Tags, TagsInternal, TagLayer, isTags } from '@/types/tags'

test('uses zhead attribute types', () => {
  expectTypeOf<MetaTag['property']>().toEqualTypeOf<Meta['property']>()
  expectTypeOf<MetaTag['name']>().toEqualTypeOf<Meta['name']>()
  expectTypeOf<MetaTag['content']>().toEqualTypeOf<NonNullable<Meta['content']>>()
  expectTypeOf<LinkTag['as']>().toEqualTypeOf<LinkBase['as']>()
})

test('narrows tags to expose internal operations', () => {
  const value: unknown = {}

  if (isTags(value)) {
    expectTypeOf(value).toEqualTypeOf<Tags & TagsInternal>()
    expectTypeOf(value.operations).toEqualTypeOf<TagLayer>()
  }
})
