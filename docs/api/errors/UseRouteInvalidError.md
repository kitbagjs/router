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

`Error.constructor`

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void
```

Create .stack property on a target object

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `targetObject` | `object` |
| `constructorOpt`? | `Function` |

#### Returns

`void`

#### Inherited from

`Error.captureStackTrace`

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| `message` | `public` | `string` | - | `Error.message` |
| `name` | `public` | `string` | - | `Error.name` |
| `stack?` | `public` | `string` | - | `Error.stack` |
| `prepareStackTrace?` | `static` | (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any` | Optional override for formatting stack traces **See** https://v8.dev/docs/stack-trace-api#customizing-stack-traces | `Error.prepareStackTrace` |
| `stackTraceLimit` | `static` | `number` | - | `Error.stackTraceLimit` |
