import { safeGetParamValue, safeSetParamValue } from './params'
import { z } from 'zod'
import { test, expect } from 'vitest'
import { initZod } from './zod'
import { withParams } from './withParams'

enum Fruits {
  Apple = 0,
  Banana = 1
}

const discriminatedUnion = z.discriminatedUnion('type', [
  z.object({ type: z.literal('one'), value: z.string() }),
  z.object({ type: z.literal('two'), value: z.number() }),
])

test.each([
  { schema: z.literal('foo'), string: 'foo', parsed: 'foo' },
  { schema: z.literal(1), string: '1', parsed: 1 },
  { schema: z.literal(true), string: 'true', parsed: true },
  { schema: z.string(), string: 'foo', parsed: 'foo' },
  { schema: z.number(), string: '1', parsed: 1 },
  { schema: z.boolean(), string: 'true', parsed: true },
  { schema: z.string().datetime(), string: '2022-01-12T00:00:00.000Z', parsed: '2022-01-12T00:00:00.000Z' },
  { schema: z.string().date(), string: '2022-01-12', parsed: '2022-01-12' },
  { schema: z.string().time(), string: '09:52:31', parsed: '09:52:31' },
  { schema: z.string().ip(), string: '192.168.1.1', parsed: '192.168.1.1' },
  { schema: z.string().cidr(), string: '192.168.0.0/24', parsed: '192.168.0.0/24' },
  { schema: z.date(), string: '2022-01-12T00:00:00.000Z', parsed: new Date('2022-01-12T00:00:00.000Z') },
  { schema: z.object({ foo: z.string() }), string: '{"foo":"bar"}', parsed: { foo: 'bar' } },
  { schema: z.object({ foo: z.string().nullable() }), string: '{"foo":null}', parsed: { foo: null } },
  { schema: z.object({ foo: z.string().optional() }), string: '{}', parsed: {} },
  { schema: z.enum(['foo', 'bar']), string: 'foo', parsed: 'foo' },
  { schema: z.nativeEnum(Fruits), string: '0', parsed: Fruits.Apple },
  { schema: z.string().array(), string: '["foo","bar"]', parsed: ['foo', 'bar'] },
  { schema: z.tuple([z.string(), z.number()]), string: '["foo",1]', parsed: ['foo', 1] },
  { schema: z.union([z.string(), z.number()]), string: 'foo', parsed: 'foo' },
  { schema: z.union([z.string(), z.number()]), string: '1', parsed: 1 },
  { schema: z.union([z.string(), z.object({ foo: z.string() })]), string: '{"foo":"bar"}', parsed: { foo: 'bar' } },
  { schema: discriminatedUnion, string: '{"type":"one","value":"foo"}', parsed: { type: 'one', value: 'foo' } },
  { schema: discriminatedUnion, string: '{"type":"two","value":1}', parsed: { type: 'two', value: 1 } },
  { schema: z.record(z.string(), z.object({ foo: z.string() })), string: '{"one":{"foo":"bar"}}', parsed: { one: { foo: 'bar' } } },
  { schema: z.map(z.string(), z.number()), string: '[["one",1]]', parsed: new Map([['one', 1]]) },
  { schema: z.set(z.number()), string: '[1,2,3]', parsed: new Set([1, 2, 3]) },
])('given $schema, returns $parsed for $string', async ({ schema, string, parsed }) => {
  await initZod()

  if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
    expect(safeGetParamValue(string, schema)).toBe(parsed)
    expect(safeSetParamValue(parsed, schema)).toBe(string)
  } else {
    expect(safeGetParamValue(string, schema)).toMatchObject(parsed)
    expect(safeSetParamValue(parsed, schema)).toBe(string)
  }
})