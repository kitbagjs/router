import { Component } from 'vue'

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
