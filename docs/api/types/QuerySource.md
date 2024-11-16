# QuerySource

QuerySource is our name for the constructor type passed to the built in [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

```ts
export type QuerySource = ConstructorParameters<typeof URLSearchParams>[0]
```
