export function unwrapTuples<T>(...records: Record<string, T[]>[]): Record<string, T | T[]> {
  return records.reduce<Record<string, T | T[]>>((unwrapped, record) => {
    Object.entries(record).forEach(([key, values]) => {
      if (values.length === 1) {
        const [value] = values
        unwrapped[key] = value
      } else {
        unwrapped[key] = values
      }
    })

    return unwrapped
  }, {})
}