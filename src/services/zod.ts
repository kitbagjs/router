/* eslint-disable @typescript-eslint/only-throw-error */
import { Param, ParamGetSet } from '@/types/paramTypes'
import { Routes } from '@/types/route'
import type { ZodSchema } from 'zod'

export type ZodSchemaLike<TOutput = any> = {
  parse: (input: any) => TOutput
}

let zod: ZodSchemas | null = null

async function getZodInstances() {
  const {
    ZodSchema,
    ZodString,
    ZodBoolean,
    ZodDate,
    ZodNumber,
    ZodLiteral,
    ZodObject,
    ZodEnum,
    ZodNativeEnum,
    ZodArray,
    ZodTuple,
    ZodUnion,
    ZodDiscriminatedUnion,
    ZodRecord,
    ZodMap,
    ZodSet,
    ZodIntersection,
    ZodPromise,
    ZodFunction
  } = await import('zod')

  return {
    ZodSchema,
    ZodString,
    ZodBoolean,
    ZodDate,
    ZodNumber,
    ZodLiteral,
    ZodObject,
    ZodEnum,
    ZodNativeEnum,
    ZodArray,
    ZodTuple,
    ZodUnion,
    ZodDiscriminatedUnion,
    ZodRecord,
    ZodMap,
    ZodSet,
    ZodIntersection,
    ZodPromise,
    ZodFunction
  }
}

type ZodSchemas = Awaited<ReturnType<typeof getZodInstances>>

export function zotParamsDetected(routes: Routes): boolean {
  return Object.values(routes).some(route => {
    return Object.values(route.host.params).some(param => isZodSchemaLike(param))
      || Object.values(route.path.params).some(param => isZodSchemaLike(param))
      || Object.values(route.query.params).some(param => isZodSchemaLike(param))
  })
}

function isZodSchemaLike(param: Param): param is ZodSchemaLike {
  return typeof param === 'object' && 'parse' in param && typeof param.parse === 'function'
}

export async function initZod(): Promise<void> {
  try {
    zod = await getZodInstances()
  } catch {
    throw new Error('Failed to initialize Zod')
  }
}

export function isZodParam(value: unknown): value is ZodSchema {
  if (!zod) {
    return false
  }

  return value instanceof zod.ZodSchema
}

export function createZodParam<T>(schema: ZodSchema<T>): ParamGetSet<T> {
  return {
    get: (value, { invalid }) => {
      try {
        return parseZodValue(value, schema) as T
      } catch {
        throw invalid()
      }
    },
    set: (value, { invalid }) => {
      try {
        return stringifyZodValue(value, schema)
      } catch {
        throw invalid()
      }
    },
  }
}

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function reviver(_key: string, value: any): any {
  if (typeof value === 'string' && isoDateRegex.test(value)) {
    const date = new Date(value)

    if (isNaN(date.getTime())) {
      return value
    }

    return date
  }

  return value
}

function tryAll<T>(fns: (() => T)[]): T {
  for (const fn of fns) {
    try {
      return fn()
    } catch {
      continue
    }
  }

  throw new Error('All functions failed')
}

// Sorts string schemas last
function sortZodSchemas(schemaA: ZodSchema, schemaB: ZodSchema): number {
  return zod?.ZodString && schemaA instanceof zod.ZodString ? 1 : zod?.ZodString && schemaB instanceof zod.ZodString ? -1 : 0
}

function parseZodValue(value: string, schema: ZodSchema): unknown {
  if (!zod) {
    throw new Error('Zod is not initialized')
  }

  if (schema instanceof zod.ZodString) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodBoolean) {
    return schema.parse(Boolean(value))
  }

  if (schema instanceof zod.ZodDate) {
    return schema.parse(new Date(value))
  }

  if (schema instanceof zod.ZodNumber) {
    return schema.parse(Number(value))
  }

  if (schema instanceof zod.ZodLiteral) {
    return tryAll([
      () => schema.parse(Number(value)),
      () => schema.parse(Boolean(value)),
      () => schema.parse(value),
    ])
  }

  if (schema instanceof zod.ZodObject) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof zod.ZodEnum) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodNativeEnum) {
    return tryAll([
      () => schema.parse(Number(value)),
      () => schema.parse(value),
    ])
  }

  if (schema instanceof zod.ZodArray) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof zod.ZodTuple) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof zod.ZodUnion) {
    const schemas = Array
      .from(schema._def.options as ZodSchema[])
      .sort(sortZodSchemas)
      .map((schema: ZodSchema) => () => parseZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof zod.ZodDiscriminatedUnion) {
    const schemas = Array
      .from(schema.options as ZodSchema[])
      .sort(sortZodSchemas)
      .map((schema: ZodSchema) => () => parseZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof zod.ZodRecord) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof zod.ZodMap) {
    return schema.parse(new Map(JSON.parse(value, reviver)))
  }

  if (schema instanceof zod.ZodSet) {
    return schema.parse(new Set(JSON.parse(value, reviver)))
  }

  if (schema instanceof zod.ZodIntersection) {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema instanceof zod.ZodPromise) {
    throw new Error('Promise schemas are not supported')
  }

  if (schema instanceof zod.ZodFunction) {
    throw new Error('Function schemas are not supported')
  }

  return schema.parse(value)
}

function stringifyZodValue(value: unknown, schema: ZodSchema): string {
  if (!zod) {
    throw new Error('Zod is not initialized')
  }

  if (schema instanceof zod.ZodString) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodBoolean) {
    return schema.parse(value).toString()
  }

  if (schema instanceof zod.ZodDate) {
    return schema.parse(value).toISOString()
  }

  if (schema instanceof zod.ZodNumber) {
    return schema.parse(Number(value)).toString()
  }

  if (schema instanceof zod.ZodLiteral) {
    return schema.parse(value).toString()
  }

  if (schema instanceof zod.ZodObject) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof zod.ZodEnum) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodNativeEnum) {
    return schema.parse(value).toString()
  }

  if (schema instanceof zod.ZodArray) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof zod.ZodTuple) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof zod.ZodUnion) {
    const schemas = Array
      .from(schema._def.options as ZodSchema[])
      .sort(sortZodSchemas)
      .map((schema: ZodSchema) => () => stringifyZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof zod.ZodDiscriminatedUnion) {
    const schemas = Array
      .from(schema.options as ZodSchema[])
      .sort(sortZodSchemas)
      .map((schema: ZodSchema) => () => stringifyZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof zod.ZodRecord) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof zod.ZodMap) {
    const parsed = schema.parse(value)

    return JSON.stringify(Array.from(parsed.entries()))
  }

  if (schema instanceof zod.ZodSet) {
    const parsed = schema.parse(value)

    return JSON.stringify(Array.from(parsed.values()))
  }

  if (schema instanceof zod.ZodIntersection) {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema instanceof zod.ZodPromise) {
    throw new Error('Promise schemas are not supported')
  }

  if (schema instanceof zod.ZodFunction) {
    throw new Error('Function schemas are not supported')
  }

  return JSON.stringify(schema.parse(value))
}
