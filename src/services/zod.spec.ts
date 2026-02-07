import { safeGetParamValue, safeSetParamValue } from './params'
import { z } from 'zod'
import { test, expect } from 'vitest'
import { initZod } from './zod'

const discriminatedUnion = z.discriminatedUnion('type', [
  z.object({ type: z.literal('one'), value: z.string() }),
  z.object({ type: z.literal('two'), value: z.number() }),
])

enum Fruits {
  Apple = '0',
  Banana = '1'
}

test.each([
  { schema: z.literal('foo'), string: 'foo', parsed: 'foo' },
  { schema: z.literal(1), string: '1', parsed: 1 },
  { schema: z.literal(true), string: 'true', parsed: true },
  { schema: z.string(), string: 'foo', parsed: 'foo' },
  { schema: z.number(), string: '1', parsed: 1 },
  { schema: z.boolean(), string: 'true', parsed: true },
  { schema: z.iso.datetime(), string: '2022-01-12T00:00:00.000Z', parsed: '2022-01-12T00:00:00.000Z' },
  { schema: z.iso.date(), string: '2022-01-12', parsed: '2022-01-12' },
  { schema: z.iso.time(), string: '09:52:31', parsed: '09:52:31' },
  { schema: z.date(), string: '2022-01-12T00:00:00.000Z', parsed: new Date('2022-01-12T00:00:00.000Z') },
  { schema: z.object({ foo: z.string() }), string: '{"foo":"bar"}', parsed: { foo: 'bar' } },
  { schema: z.object({ foo: z.string().nullable() }), string: '{"foo":null}', parsed: { foo: null } },
  { schema: z.object({ foo: z.string().optional() }), string: '{}', parsed: {} },
  { schema: z.enum(['foo', 'bar']), string: 'foo', parsed: 'foo' },
  { schema: z.enum(Fruits), string: '0', parsed: Fruits.Apple },
  { schema: z.string().array(), string: '["foo","bar"]', parsed: ['foo', 'bar'] },
  { schema: z.ipv4(), string: '192.168.1.1', parsed: '192.168.1.1' },
  { schema: z.ipv6(), string: '2001:db8::1', parsed: '2001:db8::1' },
  { schema: z.cidrv4(), string: '192.168.0.0/24', parsed: '192.168.0.0/24' },
  { schema: z.cidrv6(), string: '2001:db8::/64', parsed: '2001:db8::/64' },
  { schema: z.url(), string: 'https://example.com', parsed: 'https://example.com' },
  { schema: z.email(), string: 'test@example.com', parsed: 'test@example.com' },
  { schema: z.uuid(), string: '123e4567-e89b-12d3-a456-426614174000', parsed: '123e4567-e89b-12d3-a456-426614174000' },
  { schema: z.base64(), string: 'SGVsbG8gV29ybGQ=', parsed: 'SGVsbG8gV29ybGQ=' },
  { schema: z.cuid(), string: 'ckopqwooh000001la8h2e3xb6', parsed: 'ckopqwooh000001la8h2e3xb6' },
  { schema: z.cuid2(), string: 'tz4a98xxat96iws9zmbrgj3a', parsed: 'tz4a98xxat96iws9zmbrgj3a' },
  { schema: z.ulid(), string: '01ARZ3NDEKTSV4RRFFQ69G5FAV', parsed: '01ARZ3NDEKTSV4RRFFQ69G5FAV' },
  { schema: z.jwt(), string: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U', parsed: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U' },
  { schema: z.bigint(), string: '123', parsed: 123n },
  { schema: z.nan(), string: 'NaN', parsed: NaN },
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

  if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean' || typeof parsed === 'bigint') {
    expect(safeGetParamValue(string, [schema])).toBe(parsed)
    expect(safeSetParamValue(parsed, [schema])).toBe(string)
  } else {
    expect(safeGetParamValue(string, [schema])).toMatchObject(parsed)
    expect(safeSetParamValue(parsed, [schema])).toBe(string)
  }
})

test.each([
  { schema: z.intersection(z.object({ foo: z.string() }), z.object({ bar: z.number() })), type: 'Intersection' },
  { schema: z.promise(z.string()), type: 'Promise' },
])('$type schemas are not supported', async ({ schema }) => {
  await initZod()

  expect(safeGetParamValue('test', [schema])).toBeUndefined()
  expect(safeSetParamValue('test', [schema])).toBeUndefined()
})
