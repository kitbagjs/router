# Types: UseLoaderResolved\<TData\>

```ts
type UseLoaderResolved<TData> = object;
```

Loader refs returned after the initial data is ready.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tdata"></a> `TData` | `unknown` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="data"></a> `data` | `readonly` | `ComputedRef`\<`TData`\> |
| <a id="loading"></a> `loading` | `readonly` | `ComputedRef`\<`boolean`\> |
