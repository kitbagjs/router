import { Component } from 'vue'

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

export type RejectionType<TRejections extends Rejection[] | undefined> = TRejections extends Rejection[] ? TRejections[number]['type'] : never
