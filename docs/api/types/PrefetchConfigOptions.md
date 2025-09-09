# Types: PrefetchConfigOptions

```ts
type PrefetchConfigOptions = object;
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="components"></a> `components?` | `boolean` \| [`PrefetchStrategy`](PrefetchStrategy.md) | When true any component that is wrapped in vue's defineAsyncComponent will be prefetched **Default** `'eager'` |
| <a id="props"></a> `props?` | `boolean` \| [`PrefetchStrategy`](PrefetchStrategy.md) | When true any props for routes will be prefetched **Default** `false` |
