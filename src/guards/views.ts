import { AnyView, isView as isViewInternal } from '@/types/view'

export function isView(value: unknown): value is AnyView {
  return isViewInternal(value)
}
