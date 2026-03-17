import { Component, Ref } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { Router } from '@/types/router'
import { RouterReject } from '@/types/routerReject'

export const BUILT_IN_REJECTION_TYPES = ['NotFound'] as const
export type BuiltInRejectionType = (typeof BUILT_IN_REJECTION_TYPES)[number]

export type RouterRejection<T extends Rejection = Rejection> = Ref<T | null>
export type RouterRejections<TRouter extends Router> = TRouter['reject'] extends RouterReject<infer TRejections extends Rejection[]> ? TRejections[number] : never

export const IS_REJECTION_SYMBOL = Symbol('IS_REJECTION_SYMBOL')

export function isRejection(value: unknown): value is Rejection & RejectionInternal {
  return typeof value === 'object' && value !== null && IS_REJECTION_SYMBOL in value
}

export type RejectionInternal = {
  route: ResolvedRoute,
  [IS_REJECTION_SYMBOL]: true,
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
  /**
   * The component to render when the rejection occurs.
   */
  component: Component,
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
