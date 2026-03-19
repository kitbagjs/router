# Types: RejectionHooks\<TRejections\>

```ts
type RejectionHooks<TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRejections` *extends* `string` | `string` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onrejection"></a> `onRejection` | [`AddRejectionHook`](AddRejectionHook.md)\<`TRejections`\> | Registers a route hook to be called when a rejection occurs. |
