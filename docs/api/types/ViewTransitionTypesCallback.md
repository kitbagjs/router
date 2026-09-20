# Types: ViewTransitionTypesCallback

```ts
type ViewTransitionTypesCallback = (context) => ViewTransitionTypes | false;
```

Decides the types for a navigation. Returning `false` skips the transition for that navigation.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`ViewTransitionContext`](ViewTransitionContext.md) |

## Returns

[`ViewTransitionTypes`](ViewTransitionTypes.md) \| `false`
