# Types: PropsCallbackContext\<TParent\>

```ts
type PropsCallbackContext<TParent> = object;
```

Context provided to props callback functions

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TParent` *extends* [`Route`](Route.md) \| `undefined` | [`Route`](Route.md) \| `undefined` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="parent"></a> `parent` | [`PropsCallbackParent`](PropsCallbackParent.md)\<`TParent`\> |
| <a id="push"></a> `push` | `CallbackContext`\[`"push"`\] |
| <a id="reject"></a> `reject` | `CallbackContext`\[`"reject"`\] |
| <a id="replace"></a> `replace` | `CallbackContext`\[`"replace"`\] |
