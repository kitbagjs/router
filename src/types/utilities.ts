// Utility type that converts types like `{ foo: string } & { bar: string }`
// into `{ foo: string, bar: string }`
export type Identity<T> = T extends object ? {} & {
  [P in keyof T]: T[P]
} : T;

export type IsAny<T> = 0 extends (1 & T) ? true : false; 