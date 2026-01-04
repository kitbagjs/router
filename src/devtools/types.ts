import { setupDevtoolsPlugin } from '@vue/devtools-api'

// Extract types from DevTools API by inferring from the callback parameter
type ExtractAPIFromCallback = Parameters<Parameters<typeof setupDevtoolsPlugin>[1]>[0]
type ExtractInspectorTreeHandler = Parameters<ExtractAPIFromCallback['on']['getInspectorTree']>[0]
type ExtractInspectorStateHandler = Parameters<ExtractAPIFromCallback['on']['getInspectorState']>[0]
type ExtractInspectorStatePayload = Parameters<ExtractInspectorStateHandler>[0]

// Type definitions for the inspector
type InspectorTreePayload = Parameters<ExtractInspectorTreeHandler>[0]
type CustomInspectorNode = InspectorTreePayload['rootNodes'][number]
type InspectorNodeTag = NonNullable<CustomInspectorNode['tags']>[number]
type CustomInspectorState = ExtractInspectorStatePayload['state']

export type {
  CustomInspectorNode,
  InspectorTreePayload,
  InspectorNodeTag,
  CustomInspectorState
}
