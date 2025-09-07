# Functions: createExternalRoute()

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ToRoute<TOptions, undefined>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`WithHooks`](../types/WithHooks.md) & `object` & [`WithHost`](../types/WithHost.md) & [`WithoutParent`](../types/WithoutParent.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

[`ToRoute`](../types/ToRoute.md)\<`TOptions`, `undefined`\>

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ToRoute<TOptions, undefined>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`WithHooks`](../types/WithHooks.md) & `object` & [`WithoutHost`](../types/WithoutHost.md) & [`WithParent`](../types/WithParent.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

[`ToRoute`](../types/ToRoute.md)\<`TOptions`, `undefined`\>
