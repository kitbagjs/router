import { expect, test } from 'vitest'
import { createImportPlan } from './planImports'

test('reserves local declarations and naturally suffixed exports before allocating aliases', () => {
  const imports = createImportPlan([
    { exportName: 'countries', moduleSpecifier: './first' },
    { exportName: 'countries', moduleSpecifier: './second' },
    { exportName: 'countries_1', moduleSpecifier: './third' },
  ], ['countries_2'])
  expect(imports.getImportReference('countries', './first')).toBe('countries_3')
  expect(imports.getImportReference('countries', './second')).toBe('countries_4')
  expect(imports.getImportReference('countries_1', './third')).toBe('countries_1')
})

test('shares default imports while avoiding local declarations', () => {
  const entry = { exportName: 'default', moduleSpecifier: './loader' }
  const imports = createImportPlan([entry, entry], ['defaultImport'])
  expect(imports.declarations).toEqual(['import defaultImport_1 from "./loader"'])
})
