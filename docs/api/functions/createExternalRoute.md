# Functions: createExternalRoute()

## Call Signature

```ts
function createExternalRoute<THost, TName, TPath, TQuery, THash, TMeta>(options): Route<ToName<TName>, ToWithParams<THost>, ToWithParams<TPath>, ToWithParams<TQuery>, ToWithParams<THash>, TMeta>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `THost` *extends* \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | - |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* \| `undefined` \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* \| `undefined` \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* \| `undefined` \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`WithHooks`](../types/WithHooks.md) & `object` & `WithHost`\<`THost`\> & `WithoutParent` |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `ToWithParams`\<`THost`\>, `ToWithParams`\<`TPath`\>, `ToWithParams`\<`TQuery`\>, `ToWithParams`\<`THash`\>, `TMeta`\>

## Call Signature

```ts
function createExternalRoute<TParent, TName, TPath, TQuery, THash, TMeta>(options): Route<ToName<TName>, WithParams<"", {}>, CombinePath<TParent["path"], ToWithParams<TPath>>, CombineQuery<TParent["query"], ToWithParams<TQuery>>, CombineHash<TParent["hash"], ToWithParams<THash>>, CombineMeta<TMeta, TParent["meta"]>>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TParent` *extends* [`Route`](../types/Route.md)\<`string`, `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Record`\<`string`, `unknown`\>, `Record`\<`string`, [`Param`](../types/Param.md)\>, [`CreatedRouteOptions`](../types/CreatedRouteOptions.md)[]\> | - |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* \| `undefined` \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* \| `undefined` \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* \| `undefined` \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`WithHooks`](../types/WithHooks.md) & `object` & `WithoutHost` & `WithParent`\<`TParent`\> |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `WithParams`\<`""`, \{\}\>, `CombinePath`\<`TParent`\[`"path"`\], `ToWithParams`\<`TPath`\>\>, `CombineQuery`\<`TParent`\[`"query"`\], `ToWithParams`\<`TQuery`\>\>, `CombineHash`\<`TParent`\[`"hash"`\], `ToWithParams`\<`THash`\>\>, `CombineMeta`\<`TMeta`, `TParent`\[`"meta"`\]\>\>
