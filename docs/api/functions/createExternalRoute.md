# Functions: createExternalRoute()

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ToRoute<TOptions, undefined>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`WithHooks`](../types/WithHooks.md) & `object` & `WithHost`\< \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>\> & `WithoutParent` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

`ToRoute`\<`TOptions`, `undefined`\>

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ToRoute<TOptions, undefined>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`WithHooks`](../types/WithHooks.md) & `object` & `WithoutHost` & `WithParent`\<[`Route`](../types/Route.md)\<`string`, `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Record`\<`string`, `unknown`\>, `Record`\<`string`, [`Param`](../types/Param.md)\>, [`CreatedRouteOptions`](../types/CreatedRouteOptions.md)[]\>\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

`ToRoute`\<`TOptions`, `undefined`\>
