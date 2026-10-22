# Types: ViewCallbackContext\<TContext\>

```ts
type ViewCallbackContext<TContext> = object;
```

Navigation helpers available to a reusable view from its declared context.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tcontext"></a> `TContext` *extends* readonly `RouteContext`[] | \[\] |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<`RouteContextToRoute`\<\[`...TContext`\]\>\> |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\<`RouteContextToRejection`\<\[`...TContext`\]\>\> |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<`RouteContextToRoute`\<\[`...TContext`\]\>\> |
| <a id="signal"></a> `signal` | `AbortSignal` |
