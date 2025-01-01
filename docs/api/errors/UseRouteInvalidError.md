# Errors: UseRouteInvalidError

An error thrown when there is a mismatch between an expected route and the one actually used.

## Extends

- `Error`

## Constructors

### new UseRouteInvalidError()

```ts
new UseRouteInvalidError(routeName, actualRouteName): UseRouteInvalidError
```

Constructs a new UseRouteInvalidError instance with a message that specifies both the given and expected route names.
This detailed error message aids in quickly identifying and resolving mismatches in route usage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `routeName` | `string` | The route name that was incorrectly used. |
| `actualRouteName` | `string` | The expected route name that should have been used. |

#### Returns

[`UseRouteInvalidError`](UseRouteInvalidError.md)

#### Overrides

```ts
Error.constructor
```

## Properties

| Property | Type | Inherited from |
| ------ | ------ | ------ |
| <a id="cause"></a> `cause?` | `unknown` | `Error.cause` |
| <a id="message"></a> `message` | `string` | `Error.message` |
| <a id="name"></a> `name` | `string` | `Error.name` |
| <a id="stack"></a> `stack?` | `string` | `Error.stack` |
