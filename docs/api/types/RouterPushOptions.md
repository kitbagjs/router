# Types: RouterPushOptions\<TState\>

```ts
type RouterPushOptions<TState> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tstate"></a> `TState` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="hash"></a> `hash?` | `string` | The hash to append to the url. |
| <a id="navigation"></a> `navigation?` | [`NavigationBehavior`](NavigationBehavior.md) | Overrides the route and router navigation behavior. |
| <a id="query"></a> `query?` | [`QuerySource`](QuerySource.md) | The query string to add to the url. |
| <a id="replace"></a> `replace?` | `boolean` | Whether to replace the current history entry. |
| <a id="state"></a> `state?` | `Partial`\<`TState`\> | State values to pass to the route. |
| <a id="viewtransition"></a> `viewTransition?` | [`ViewTransitionConfig`](ViewTransitionConfig.md) | Animates the navigation with the View Transitions API. Overrides route and router level viewTransition. |
