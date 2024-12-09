/**
 * An error thrown when a parent's meta has the same key as a child and the types are not compatible.
 * A child's meta can override properties of the parent, however the types must match!
 * @group Errors
 */
export class MetaPropertyConflict extends Error {
  public constructor(property?: string) {
    super(`Child property on meta for ${property} conflicts with the parent meta.`)
  }
}
