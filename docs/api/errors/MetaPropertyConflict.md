# Errors: MetaPropertyConflict

An error thrown when a parent's meta has the same key as a child and the types are not compatible.
A child's meta can override properties of the parent, however the types must match!

## Extends

- `Error`

## Constructors

### new MetaPropertyConflict()

```ts
new MetaPropertyConflict(property?): MetaPropertyConflict
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `property`? | `string` |

#### Returns

[`MetaPropertyConflict`](MetaPropertyConflict.md)

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
| `cause?` | `public` | `unknown` | - | `Error.cause` |
| `message` | `public` | `string` | - | `Error.message` |
| `name` | `public` | `string` | - | `Error.name` |
| `stack?` | `public` | `string` | - | `Error.stack` |
| `prepareStackTrace?` | `static` | (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any` | Optional override for formatting stack traces **See** https://v8.dev/docs/stack-trace-api#customizing-stack-traces | `Error.prepareStackTrace` |
| `stackTraceLimit` | `static` | `number` | - | `Error.stackTraceLimit` |
