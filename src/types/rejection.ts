import { Ref } from 'vue'
import { Route } from '@/types/route'
import { Router } from '@/types/router'
import { RouterReject } from '@/types/routerReject'
import { Hooks } from '@/models/hooks'

export const BUILT_IN_REJECTION_TYPES = ['NotFound'] as const
export type BuiltInRejectionType = (typeof BUILT_IN_REJECTION_TYPES)[number]

export type RouterRejection<T extends Rejection = Rejection> = Ref<T | null>
export type RouterRejections<TRouter extends Router> = TRouter['reject'] extends RouterReject<infer TRejections extends Rejection[]> ? TRejections[number] : never

export const IS_REJECTION_SYMBOL = Symbol('IS_REJECTION_SYMBOL')

export function isRejection(value: unknown): value is Rejection & RejectionInternal {
  return typeof value === 'object' && value !== null && IS_REJECTION_SYMBOL in value
}

export type RejectionInternal = {
  [IS_REJECTION_SYMBOL]: true,
  route: Route,
  hooks: Hooks[],
}

/**
 * Represents an immutable array of Rejection instances.
 */
export type Rejections = readonly Rejection[]

export type Rejection<TType extends string = string> = {
  /**
   * The type of rejection.
   */
  type: TType,
}

export type RejectionType<TRejections extends Rejections | undefined> =
unknown extends TRejections
  ? never
  : Rejections extends TRejections
    ? string
    : undefined extends TRejections
      ? string
      : TRejections extends Rejections
        ? TRejections[number]['type']
        : never

export type ExtractRejections<T> = T extends { rejections: infer TRejections extends Rejections } ? TRejections : []
export type ExtractRejectionTypes<T extends Rejections> = T[number]['type'] extends string ? T[number]['type'] : never
