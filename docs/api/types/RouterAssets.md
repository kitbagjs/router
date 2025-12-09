# Types: RouterAssets&lt;TRouter&gt;

```ts
type RouterAssets<TRouter> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](Router.md) |

## Compositions

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="uselink"></a> `useLink` | `ReturnType`&lt;*typeof* `createUseLink`&gt; | A composition to export much of the functionality that drives RouterLink component. Also exports some useful context about routes relationship to current URL and convenience methods for navigating. **Param** The name of the route or a valid URL. **Param** If providing route name, this argument will expect corresponding params. **Param** [RouterResolveOptions](RouterResolveOptions.md) Same options as router resolve. |
| <a id="usequeryvalue"></a> `useQueryValue` | `ReturnType`&lt;*typeof* `createUseQueryValue`&gt; | A composition to access a specific query value from the current route. |
| <a id="useroute"></a> `useRoute` | `ReturnType`&lt;*typeof* `createUseRoute`&gt; | A composition to access the current route or verify a specific route name within a Vue component. This function provides two overloads: 1. When called without arguments, it returns the current route from the router without types. 2. When called with a route name, it checks if the current active route includes the specified route name. The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route name if provided, throwing an error if the validation fails at any point during the component's lifecycle. **Template** A string type that should match route name of RouterRouteName&lt;TRouter&gt;, ensuring the route name exists. **Param** Optional. The name of the route to validate against the current active routes. **Throws** Throws an error if the provided route name is not valid or does not match the current route. |
| <a id="userouter"></a> `useRouter` | `ReturnType`&lt;*typeof* `createUseRouter`&gt; | A composition to access the installed router instance within a Vue component. **Throws** Throws an error if the router has not been installed, ensuring the component does not operate without routing functionality. |

## Components

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="routerlink"></a> `RouterLink` | `ReturnType`&lt;*typeof* `createRouterLink`&gt; | A component to render a link to a route or any url. **Param** The props to pass to the router link component. |
| <a id="routerview"></a> `RouterView` | `ReturnType`&lt;*typeof* `createRouterView`&gt; | A component to render the current route's component. **Param** The props to pass to the router view component. |

## Guards

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="isroute"></a> `isRoute` | `ReturnType`&lt;*typeof* `createIsRoute`&gt; | A guard to verify if a route or unknown value matches a given route name. **Param** The name of the route to check against the current route. |

## Hooks

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onafterrouteleave"></a> `onAfterRouteLeave` | [`AddRouterAfterRouteHook`](AddRouterAfterRouteHook.md)&lt;[`RouterRoutes`](RouterRoutes.md)&lt;`TRouter`&gt;, [`RouterRejections`](RouterRejections.md)&lt;`TRouter`&gt;&gt; | Registers a hook that is called after a route has been left. Must be called during setup. This can be used for cleanup actions after the component is no longer active, ensuring proper resource management. **Param** The hook callback function |
| <a id="onafterrouteupdate"></a> `onAfterRouteUpdate` | [`AddRouterAfterRouteHook`](AddRouterAfterRouteHook.md)&lt;[`RouterRoutes`](RouterRoutes.md)&lt;`TRouter`&gt;, [`RouterRejections`](RouterRejections.md)&lt;`TRouter`&gt;&gt; | Registers a hook that is called after a route has been updated. Must be called during setup. This is ideal for responding to updates within the same route, such as parameter changes, without full component reloads. **Param** The hook callback function |
| <a id="onbeforerouteleave"></a> `onBeforeRouteLeave` | [`AddRouterBeforeRouteHook`](AddRouterBeforeRouteHook.md)&lt;[`RouterRoutes`](RouterRoutes.md)&lt;`TRouter`&gt;, [`RouterRejections`](RouterRejections.md)&lt;`TRouter`&gt;&gt; | Registers a hook that is called before a route is left. Must be called from setup. This is useful for performing actions or cleanups before navigating away from a route component. **Param** The hook callback function |
| <a id="onbeforerouteupdate"></a> `onBeforeRouteUpdate` | [`AddRouterBeforeRouteHook`](AddRouterBeforeRouteHook.md)&lt;[`RouterRoutes`](RouterRoutes.md)&lt;`TRouter`&gt;, [`RouterRejections`](RouterRejections.md)&lt;`TRouter`&gt;&gt; | Registers a hook that is called before a route is updated. Must be called from setup. This is particularly useful for handling changes in route parameters or query while staying within the same component. **Param** The hook callback function |
