# Functions: createRoute()

## Call Signature

```ts
function createRoute<TName, TPath, TQuery, THash, TMeta, TState>(options): Route<ToName<TName>, Host<"", {}>, ToPath<TPath>, ToQuery<TQuery>, ToHash<THash>, TMeta, TState, TName>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* `undefined` \| `string` \| `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* `undefined` \| `string` \| `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TState` *extends* `Record`\<`string`, [`Param`](../types/Param.md)\> | `Record`\<`string`, [`Param`](../types/Param.md)\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateRouteOptions`](../types/CreateRouteOptions.md)\<`TName`, `TPath`, `TQuery`, `THash`, `TMeta`\> & `WithHooks` & WithoutComponents & (WithoutParent & (WithState\<TState\> \| WithoutState)) |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `Host`\<`""`, \{\}\>, `ToPath`\<`TPath`\>, `ToQuery`\<`TQuery`\>, `ToHash`\<`THash`\>, `TMeta`, `TState`, `TName`\>

## Call Signature

```ts
function createRoute<TParent, TName, TPath, TQuery, THash, TMeta, TState>(options): Route<ToName<TName>, Host<"", {}>, CombinePath<TParent["path"], ToPath<TPath>>, CombineQuery<TParent["query"], ToQuery<TQuery>>, CombineHash<TParent["hash"], ToHash<THash>>, CombineMeta<TMeta, TParent["meta"]>, CombineState<TState, TParent["state"]>, TName | TParent["matches"][number]["name"]>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TParent` *extends* [`Route`](../types/Route.md)\<`string`, `Host`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Hash`\<`undefined` \| `string`\>, `Record`\<`string`, `unknown`\>, `Record`\<`string`, [`Param`](../types/Param.md)\>, `undefined` \| `string`\> | - |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* `undefined` \| `string` \| `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* `undefined` \| `string` \| `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TState` *extends* `Record`\<`string`, [`Param`](../types/Param.md)\> | `Record`\<`string`, [`Param`](../types/Param.md)\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateRouteOptions`](../types/CreateRouteOptions.md)\<`TName`, `TPath`, `TQuery`, `THash`, `TMeta`\> & `WithHooks` & WithoutComponents & (WithParent\<TParent\> & (WithoutState \| WithState\<TState\>)) |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `Host`\<`""`, \{\}\>, `CombinePath`\<`TParent`\[`"path"`\], `ToPath`\<`TPath`\>\>, `CombineQuery`\<`TParent`\[`"query"`\], `ToQuery`\<`TQuery`\>\>, `CombineHash`\<`TParent`\[`"hash"`\], `ToHash`\<`THash`\>\>, `CombineMeta`\<`TMeta`, `TParent`\[`"meta"`\]\>, `CombineState`\<`TState`, `TParent`\[`"state"`\]\>, `TName` \| `TParent`\[`"matches"`\]\[`number`\]\[`"name"`\]\>

## Call Signature

```ts
function createRoute<TComponent, TName, TPath, TQuery, THash, TMeta, TState>(options): Route<ToName<TName>, Host<"", {}>, ToPath<TPath>, ToQuery<TQuery>, ToHash<THash>, TMeta, TState, TName>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TComponent` *extends* `Component` | - |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* `undefined` \| `string` \| `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* `undefined` \| `string` \| `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TState` *extends* `Record`\<`string`, [`Param`](../types/Param.md)\> | `Record`\<`string`, [`Param`](../types/Param.md)\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateRouteOptions`](../types/CreateRouteOptions.md)\<`TName`, `TPath`, `TQuery`, `THash`, `TMeta`\> & `WithHooks` & WithComponent\<TComponent, Route\<ToName\<TName\>, Host\<"", \{\}\>, ToPath\<TPath\>, ToQuery\<TQuery\>, ToHash\<THash\>, TMeta, TState, TName\>\> & (WithoutParent & (WithoutState \| WithState\<...\>)) |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `Host`\<`""`, \{\}\>, `ToPath`\<`TPath`\>, `ToQuery`\<`TQuery`\>, `ToHash`\<`THash`\>, `TMeta`, `TState`, `TName`\>

## Call Signature

```ts
function createRoute<TComponent, TParent, TName, TPath, TQuery, THash, TMeta, TState>(options): Route<ToName<TName>, Host<"", {}>, CombinePath<TParent["path"], ToPath<TPath>>, CombineQuery<TParent["query"], ToQuery<TQuery>>, CombineHash<TParent["hash"], ToHash<THash>>, CombineMeta<TMeta, TParent["meta"]>, CombineState<TState, TParent["state"]>, TName | TParent["matches"][number]["name"]>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TComponent` *extends* `Component` | - |
| `TParent` *extends* [`Route`](../types/Route.md)\<`string`, `Host`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Hash`\<`undefined` \| `string`\>, `Record`\<`string`, `unknown`\>, `Record`\<`string`, [`Param`](../types/Param.md)\>, `undefined` \| `string`\> | - |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* `undefined` \| `string` \| `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* `undefined` \| `string` \| `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TState` *extends* `Record`\<`string`, [`Param`](../types/Param.md)\> | `Record`\<`string`, [`Param`](../types/Param.md)\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateRouteOptions`](../types/CreateRouteOptions.md)\<`TName`, `TPath`, `TQuery`, `THash`, `TMeta`\> & `WithHooks` & WithComponent\<TComponent, Route\<ToName\<TName\>, Host\<"", \{\}\>, CombinePath\<TParent\["path"\], ToPath\<TPath\>\>, CombineQuery\<...\>, CombineHash\<...\>, CombineMeta\<...\>, CombineState\<...\>, TName \| TParent\["matches"\]\[number\]\["name"\]\>\> & (WithParent\<...\> & (WithoutState \| WithState\<...\>)) |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `Host`\<`""`, \{\}\>, `CombinePath`\<`TParent`\[`"path"`\], `ToPath`\<`TPath`\>\>, `CombineQuery`\<`TParent`\[`"query"`\], `ToQuery`\<`TQuery`\>\>, `CombineHash`\<`TParent`\[`"hash"`\], `ToHash`\<`THash`\>\>, `CombineMeta`\<`TMeta`, `TParent`\[`"meta"`\]\>, `CombineState`\<`TState`, `TParent`\[`"state"`\]\>, `TName` \| `TParent`\[`"matches"`\]\[`number`\]\[`"name"`\]\>

## Call Signature

```ts
function createRoute<TComponents, TName, TPath, TQuery, THash, TMeta, TState>(options): Route<ToName<TName>, Host<"", {}>, ToPath<TPath>, ToQuery<TQuery>, ToHash<THash>, TMeta, TState, TName>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TComponents` *extends* `Record`\<`string`, `Component`\> | - |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* `undefined` \| `string` \| `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* `undefined` \| `string` \| `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TState` *extends* `Record`\<`string`, [`Param`](../types/Param.md)\> | `Record`\<`string`, [`Param`](../types/Param.md)\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateRouteOptions`](../types/CreateRouteOptions.md)\<`TName`, `TPath`, `TQuery`, `THash`, `TMeta`\> & `WithHooks` & WithComponents\<TComponents, Route\<ToName\<TName\>, Host\<"", \{\}\>, ToPath\<TPath\>, ToQuery\<TQuery\>, ToHash\<THash\>, TMeta, TState, TName\>\> & (WithoutParent & (WithoutState \| WithState\<...\>)) |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `Host`\<`""`, \{\}\>, `ToPath`\<`TPath`\>, `ToQuery`\<`TQuery`\>, `ToHash`\<`THash`\>, `TMeta`, `TState`, `TName`\>

## Call Signature

```ts
function createRoute<TComponents, TParent, TName, TPath, TQuery, THash, TMeta, TState>(options): Route<ToName<TName>, Host<"", {}>, CombinePath<TParent["path"], ToPath<TPath>>, CombineQuery<TParent["query"], ToQuery<TQuery>>, CombineHash<TParent["hash"], ToHash<THash>>, CombineMeta<TMeta, TParent["meta"]>, CombineState<TState, TParent["state"]>, TName | TParent["matches"][number]["name"]>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TComponents` *extends* `Record`\<`string`, `Component`\> | - |
| `TParent` *extends* [`Route`](../types/Route.md)\<`string`, `Host`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Hash`\<`undefined` \| `string`\>, `Record`\<`string`, `unknown`\>, `Record`\<`string`, [`Param`](../types/Param.md)\>, `undefined` \| `string`\> | - |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* `undefined` \| `string` \| `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* `undefined` \| `string` \| `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TState` *extends* `Record`\<`string`, [`Param`](../types/Param.md)\> | `Record`\<`string`, [`Param`](../types/Param.md)\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateRouteOptions`](../types/CreateRouteOptions.md)\<`TName`, `TPath`, `TQuery`, `THash`, `TMeta`\> & `WithHooks` & WithComponents\<TComponents, Route\<ToName\<TName\>, Host\<"", \{\}\>, CombinePath\<TParent\["path"\], ToPath\<TPath\>\>, ... 4 more ..., TName \| TParent\["matches"\]\[number\]\["name"\]\>\> & (WithParent\<...\> & (WithoutState \| WithState\<...\>)) |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `Host`\<`""`, \{\}\>, `CombinePath`\<`TParent`\[`"path"`\], `ToPath`\<`TPath`\>\>, `CombineQuery`\<`TParent`\[`"query"`\], `ToQuery`\<`TQuery`\>\>, `CombineHash`\<`TParent`\[`"hash"`\], `ToHash`\<`THash`\>\>, `CombineMeta`\<`TMeta`, `TParent`\[`"meta"`\]\>, `CombineState`\<`TState`, `TParent`\[`"state"`\]\>, `TName` \| `TParent`\[`"matches"`\]\[`number`\]\[`"name"`\]\>
