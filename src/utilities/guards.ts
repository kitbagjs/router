export function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null
}

export function hasProperty<
  TSource extends Record<PropertyKey, unknown>,
  TProperty extends PropertyKey,
  TType extends() => unknown
>(value: TSource, key: TProperty, type?: TType): value is TSource & Record<TProperty, ReturnType<TType>> {
  const propertyExists = isRecord(value) && key in value

  if (!propertyExists) {
    return false
  }

  if (type) {
    return typeof value[key] === typeof type()
  }

  return true
}

const test = { bar: true }

if (hasProperty(test, 'foo', Boolean)) {
  test
}