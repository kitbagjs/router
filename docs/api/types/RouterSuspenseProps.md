# Types: RouterSuspenseProps

```ts
type RouterSuspenseProps = object;
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="catch"></a> `catch?` | `boolean` \| ((`error`) => `boolean`) | Includes component errors when true or when the predicate returns true. |
| <a id="loaders"></a> `loaders?` | `boolean` | Includes awaited loader errors. Defaults to true. |
| <a id="props"></a> `props?` | `boolean` | Includes route props getter errors. Defaults to true. |
