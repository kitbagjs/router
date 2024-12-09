# Errors: DuplicateParamsError

An error thrown when duplicate parameters are detected in a route.
Param names must be unique. This includes params defined in a path
parent and params defined in the query.

## Extends

- `Error`

## Constructors

### new DuplicateParamsError()

```ts
new DuplicateParamsError(paramName): DuplicateParamsError
```

Constructs a new DuplicateParamsError instance with a message indicating the problematic parameter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `paramName` | `string` | The name of the parameter that was duplicated. |

#### Returns

[`DuplicateParamsError`](DuplicateParamsError.md)

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
