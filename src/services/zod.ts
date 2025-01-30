/* eslint-disable @typescript-eslint/only-throw-error */
import { ParamGetSet } from '@/types/paramTypes'
import {
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
} from 'zod'

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
  return schemaA instanceof ZodString ? 1 : schemaB instanceof ZodString ? -1 : 0
}

function parseZodValue(value: string, schema: ZodSchema): unknown {
  if (schema instanceof ZodString) {
    return schema.parse(value)
  }

  if (schema instanceof ZodBoolean) {
    return schema.parse(Boolean(value))
  }

  if (schema instanceof ZodDate) {
    return schema.parse(new Date(value))
  }

  if (schema instanceof ZodNumber) {
    return schema.parse(Number(value))
  }

  if (schema instanceof ZodLiteral) {
    return tryAll([
      () => schema.parse(Number(value)),
      () => schema.parse(Boolean(value)),
      () => schema.parse(value),
    ])
  }

  if (schema instanceof ZodObject) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof ZodEnum) {
    return schema.parse(value)
  }

  if (schema instanceof ZodNativeEnum) {
    return tryAll([
      () => schema.parse(Number(value)),
      () => schema.parse(value),
    ])
  }

  if (schema instanceof ZodArray) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof ZodTuple) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof ZodUnion) {
    const schemas = Array
      .from(schema._def.options as ZodSchema[])
      .sort(sortZodSchemas)
      .map((schema: ZodSchema) => () => parseZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof ZodDiscriminatedUnion) {
    const schemas = Array
      .from(schema.options as ZodSchema[])
      .sort(sortZodSchemas)
      .map((schema: ZodSchema) => () => parseZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof ZodRecord) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof ZodMap) {
    return schema.parse(new Map(JSON.parse(value, reviver)))
  }

  if (schema instanceof ZodSet) {
    return schema.parse(new Set(JSON.parse(value, reviver)))
  }

  if (schema instanceof ZodIntersection) {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema instanceof ZodPromise) {
    throw new Error('Promise schemas are not supported')
  }

  if (schema instanceof ZodFunction) {
    throw new Error('Function schemas are not supported')
  }

  return schema.parse(value)
}

function stringifyZodValue(value: unknown, schema: ZodSchema): string {
  if (schema instanceof ZodString) {
    return schema.parse(value)
  }

  if (schema instanceof ZodBoolean) {
    return schema.parse(value).toString()
  }

  if (schema instanceof ZodDate) {
    return schema.parse(value).toISOString()
  }

  if (schema instanceof ZodNumber) {
    return schema.parse(Number(value)).toString()
  }

  if (schema instanceof ZodLiteral) {
    return schema.parse(value).toString()
  }

  if (schema instanceof ZodObject) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof ZodEnum) {
    return schema.parse(value)
  }

  if (schema instanceof ZodNativeEnum) {
    return schema.parse(value).toString()
  }

  if (schema instanceof ZodArray) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof ZodTuple) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof ZodUnion) {
    const schemas = Array
      .from(schema._def.options as ZodSchema[])
      .sort(sortZodSchemas)
      .map((schema: ZodSchema) => () => stringifyZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof ZodDiscriminatedUnion) {
    const schemas = Array
      .from(schema.options as ZodSchema[])
      .sort(sortZodSchemas)
      .map((schema: ZodSchema) => () => stringifyZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof ZodRecord) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof ZodMap) {
    const parsed = schema.parse(value)

    return JSON.stringify(Array.from(parsed.entries()))
  }

  if (schema instanceof ZodSet) {
    const parsed = schema.parse(value)

    return JSON.stringify(Array.from(parsed.values()))
  }

  if (schema instanceof ZodIntersection) {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema instanceof ZodPromise) {
    throw new Error('Promise schemas are not supported')
  }

  if (schema instanceof ZodFunction) {
    throw new Error('Function schemas are not supported')
  }

  return JSON.stringify(schema.parse(value))
}
