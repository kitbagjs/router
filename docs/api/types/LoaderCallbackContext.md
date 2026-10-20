# Types: LoaderCallbackContext\<TContext\>

```ts
type LoaderCallbackContext<TContext> = object;
```

Navigation helpers available to a reusable loader, typed from its declared context.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` *extends* readonly `RouteContext`[] | \[\] |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<`RouteContextToRoute`\<\[`...TContext`\]\>\> |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\<`RouteContextToRejection`\<\[`...TContext`\]\>\> |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<`RouteContextToRoute`\<\[`...TContext`\]\>\> |
| <a id="signal"></a> `signal` | `AbortSignal` |
