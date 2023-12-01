export const location = {
  get() {
    return 'test'
  },
  set(value: string) {
    console.log('set', value)
  },
}