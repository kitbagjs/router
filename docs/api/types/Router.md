# Types: Router\<TRoutes, __TOptions\>

```ts
type Router<TRoutes, __TOptions>: object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | `any` |
| `__TOptions` *extends* [`RouterOptions`](RouterOptions.md) | `any` |

## Type declaration

### back()

```ts
back: () => void;
```

Navigates to the previous entry in the browser's history stack.

#### Returns

`void`

### find()

```ts
find: (url, options?) => ResolvedRoute | undefined;
```

Creates a ResolvedRoute record for a given URL.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `options`? | `RouterResolveOptions` |

#### Returns

[`ResolvedRoute`](ResolvedRoute.md) \| `undefined`

### forward()

```ts
forward: () => void;
```

Navigates to the next entry in the browser's history stack.

#### Returns

`void`

### go()

```ts
go: (delta) => void;
```

Moves the current history entry to a specific point in the history stack.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `delta` | `number` |

#### Returns

`void`

### install()

```ts
install: (app) => void;
```

Installs the router into a Vue application instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `app` | `App` | The Vue application instance to install the router into |

#### Returns

`void`

### isExternal()

```ts
isExternal: (url) => boolean;
```

Given a URL, returns true if host does not match host stored on router instance

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |

#### Returns

`boolean`

### onAfterRouteEnter

```ts
onAfterRouteEnter: AddAfterRouteHook;
```

Registers a hook to be called after a route is entered.

### onAfterRouteLeave

```ts
onAfterRouteLeave: AddAfterRouteHook;
```

Registers a hook to be called after a route is left.

### onAfterRouteUpdate

```ts
onAfterRouteUpdate: AddAfterRouteHook;
```

Registers a hook to be called after a route is updated.

### onBeforeRouteEnter

```ts
onBeforeRouteEnter: AddBeforeRouteHook;
```

Registers a hook to be called before a route is entered.

### onBeforeRouteLeave

```ts
onBeforeRouteLeave: AddBeforeRouteHook;
```

Registers a hook to be called before a route is left.

### onBeforeRouteUpdate

```ts
onBeforeRouteUpdate: AddBeforeRouteHook;
```

Registers a hook to be called before a route is updated.

### prefetch?

```ts
optional prefetch: PrefetchConfig;
```

Determines what assets are prefetched.

### push

```ts
push: RouterPush<TRoutes>;
```

Navigates to a specified path or route object in the history stack, adding a new entry.

### refresh()

```ts
refresh: () => void;
```

Forces the router to re-evaluate the current route.

#### Returns

`void`

### reject

```ts
reject: RouterReject;
```

Handles route rejection based on a specified rejection type.

### replace

```ts
replace: RouterReplace<TRoutes>;
```

Replaces the current entry in the history stack with a new one.

### resolve

```ts
resolve: RouterResolve<TRoutes>;
```

Creates a ResolvedRoute record for a given route name and params.

### route

```ts
route: RouterRoutes<TRoutes>;
```

Manages the current route state.

### start()

```ts
start: () => Promise<void>;
```

Initializes the router based on the initial route. Automatically called when the router is installed. Calling this more than once has no effect.

#### Returns

`Promise`\<`void`\>
