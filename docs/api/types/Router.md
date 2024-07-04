# Router\<TRoutes\>

```ts
type Router<TRoutes>: Plugin & object;
```

## Type declaration

### back()

```ts
back: () => void;
```

Navigates to the previous entry in the browser's history stack.

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

### go()

```ts
go: (delta: number) => void;
```

Moves the current history entry to a specific point in the history stack.

### initialized

```ts
initialized: Promise<void>;
```

A promise that resolves when the router is fully initialized.

### isExternal

```ts
isExternal: (url: string) => boolean
```

A utility function for determining if the host of a given url matches the host stored on the router instance.

### onAfterRouteEnter

```ts
onAfterRouteEnter: AddAfterRouteHook;
```

Registers a hook to be called after a route is entered. [AddAfterRouteHook](/api/types/AddAfterRouteHook)

### onAfterRouteLeave

```ts
onAfterRouteLeave: AddAfterRouteHook;
```

Registers a hook to be called after a route is left. [AddAfterRouteHook](/api/types/AddAfterRouteHook)

### onAfterRouteUpdate

```ts
onAfterRouteUpdate: AddAfterRouteHook;
```

Registers a hook to be called after a route is updated. [AddAfterRouteHook](/api/types/AddAfterRouteHook)

### onBeforeRouteEnter

```ts
onBeforeRouteEnter: AddBeforeRouteHook;
```

Registers a hook to be called before a route is entered. [AddBeforeRouteHook](/api/types/AddBeforeRouteHook)

### onBeforeRouteLeave

```ts
onBeforeRouteLeave: AddBeforeRouteHook;
```

Registers a hook to be called before a route is left. [AddBeforeRouteHook](/api/types/AddBeforeRouteHook)

### onBeforeRouteUpdate

```ts
onBeforeRouteUpdate: AddBeforeRouteHook;
```

Registers a hook to be called before a route is updated. [AddBeforeRouteHook](/api/types/AddBeforeRouteHook)

### push

```ts
push: RouterPush;
```

Navigates to a specified path or route object in the history stack, adding a new entry. [RouterPush](/api/types/RouterPush)

### refresh()

```ts
refresh: () => void;
```

Forces the router to re-evaluate the current route.

### reject

```ts
reject: RouterReject;
```

Handles route rejection based on a specified rejection type.

### replace

```ts
replace: RouterReplace;
```

Replaces the current entry in the history stack with a new one. [RouterReplace](/api/types/RouterReplace)

### resolve

```ts
resolve: RouterResolve;
```

Resolves a URL to a route object. [RouterResolve](/api/types/RouterResolve)

### route

```ts
route: Route;
```

Manages the current route state. [Route](/api/types/Route)

## Type parameters

| Type parameter |
| :------ |
| `TRoutes` *extends* [`Routes`](Routes) |
