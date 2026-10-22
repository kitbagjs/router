# Types: RouterReplaceOptions\<TState\>

```ts
type RouterReplaceOptions<TState> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tstate"></a> `TState` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="hash"></a> `hash?` | `string` | - |
| <a id="navigation"></a> `navigation?` | [`NavigationBehavior`](NavigationBehavior.md) | Overrides the route and router navigation behavior. |
| <a id="query"></a> `query?` | [`QuerySource`](QuerySource.md) | - |
| <a id="state"></a> `state?` | `Partial`\<`TState`\> | - |
