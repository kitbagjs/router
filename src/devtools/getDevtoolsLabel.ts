/**
 * Generates a DevTools label with optional router instance ID.
 * If the router ID is greater than 1, appends the ID to the label.
 *
 * @param label - Base label for the DevTools element
 * @param routerId - Router instance ID (string from createUniqueIdSequence)
 * @returns Label with ID appended if routerId > '1'
 *
 * @example
 * getDevtoolsLabel('Routes', '1') // 'Routes'
 * getDevtoolsLabel('Routes', '2') // 'Routes 2'
 */
export function getDevtoolsLabel(label: string, routerId: string): string {
  return routerId !== '1' ? `${label} ${routerId}` : label
}

