import { safeGetParamValue, safeSetParamValue } from './params'
import { test, expect } from 'vitest'
import * as v from 'valibot'

enum Fruits {
  Apple = 0,
  Banana = 1
}

const discriminatedUnion = v.variant('type', [
  v.object({ type: v.literal('one'), value: v.string() }),
  v.object({ type: v.literal('two'), value: v.number() }),
])

test.each([
  { schema: v.literal('foo'), string: 'foo', parsed: 'foo' },
  { schema: v.literal(1), string: '1', parsed: 1 },
  { schema: v.literal(true), string: 'true', parsed: true },
  { schema: v.string(), string: 'foo', parsed: 'foo' },
  { schema: v.number(), string: '1', parsed: 1 },
  { schema: v.boolean(), string: 'true', parsed: true },
  { schema: v.date(), string: '2022-01-12T00:00:00.000Z', parsed: new Date('2022-01-12T00:00:00.000Z') },
  { schema: v.object({ foo: v.string() }), string: '{"foo":"bar"}', parsed: { foo: 'bar' } },
  { schema: v.object({ foo: v.nullable(v.string()) }), string: '{"foo":null}', parsed: { foo: null } },
  { schema: v.object({ foo: v.optional(v.string()) }), string: '{}', parsed: {} },
  { schema: v.enum(Fruits), string: '0', parsed: Fruits.Apple },
  { schema: v.array(v.string()), string: '["foo","bar"]', parsed: ['foo', 'bar'] },
  { schema: v.tuple([v.string(), v.number()]), string: '["foo",1]', parsed: ['foo', 1] },
  { schema: v.union([v.string(), v.number()]), string: 'foo', parsed: 'foo' },
  { schema: v.union([v.string(), v.number()]), string: '1', parsed: 1 },
  { schema: v.union([v.string(), v.object({ foo: v.string() })]), string: '{"foo":"bar"}', parsed: { foo: 'bar' } },
  { schema: discriminatedUnion, string: '{"type":"one","value":"foo"}', parsed: { type: 'one', value: 'foo' } },
  { schema: discriminatedUnion, string: '{"type":"two","value":1}', parsed: { type: 'two', value: 1 } },
  { schema: v.record(v.string(), v.object({ foo: v.string() })), string: '{"one":{"foo":"bar"}}', parsed: { one: { foo: 'bar' } } },
  { schema: v.map(v.string(), v.number()), string: '[["one",1]]', parsed: new Map([['one', 1]]) },
  { schema: v.set(v.number()), string: '[1,2,3]', parsed: new Set([1, 2, 3]) },
])('given $schema.type, returns $parsed for $string', async ({ schema, string, parsed }) => {
  if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
    expect(safeGetParamValue(string, [schema])).toBe(parsed)
    expect(safeSetParamValue(parsed, [schema])).toBe(string)
  } else {
    expect(safeGetParamValue(string, [schema])).toMatchObject(parsed)
    expect(safeSetParamValue(parsed, [schema])).toBe(string)
  }
})
