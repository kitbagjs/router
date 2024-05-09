# Router\<TRoutes\>

```ts
type Router<TRoutes>: Plugin_2 & object;
```

## Type declaration

### back()

```ts
back: () => void;
```

Navigates to the previous entry in the browser's history stack.

#### Returns

`void`

### find

```ts
find: RouterFind<TRoutes>;
```

Finds a route object based on the provided lookup parameters.

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
| :------ | :------ |
| `delta` | `number` |

#### Returns

`void`

### initialized

```ts
initialized: Promise<void>;
```

A promise that resolves when the router is fully initialized.

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

Resolves a URL to a route object.

### route

```ts
route: RouterRoute;
```

Manages the current route state.

## Type parameters

| Type parameter | Value |
| :------ | :------ |
| `TRoutes` *extends* [`Routes`](Routes) | `any` |
