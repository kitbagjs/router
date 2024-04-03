export function removePartial<T extends Record<PropertyKey, any>>(value: Partial<T>): Required<T> {
  const onlyRequired = {} as Required<T>

  return Object.entries(value).reduce((onlyRequired, [property, value]) => {
    if (value !== undefined) {
      return {
        ...onlyRequired,
        [property]: value,
      }
    }

    return onlyRequired
  }, onlyRequired)
}