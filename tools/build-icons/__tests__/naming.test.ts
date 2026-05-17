import { describe, expect, it } from 'vitest';
import {
  brandYearComponent,
  brandYearFile,
  nameToPascal,
  slugToCamel,
  slugToPascal,
} from '../src/naming';

describe('slugToCamel', () => {
  it.each([
    ['apple', 'apple'],
    ['google-meet', 'googleMeet'],
    ['vs-code', 'vsCode'],
    ['x-y-z', 'xYZ'],
    ['a', 'a'],
  ])('%s → %s', (input, expected) => {
    expect(slugToCamel(input)).toBe(expected);
  });
});

describe('slugToPascal', () => {
  it.each([
    ['apple', 'Apple'],
    ['google-meet', 'GoogleMeet'],
    ['vs-code', 'VsCode'],
    ['x-y-z', 'XYZ'],
  ])('%s → %s', (input, expected) => {
    expect(slugToPascal(input)).toBe(expected);
  });
});

describe('nameToPascal', () => {
  it.each([
    ['Apple', 'Apple'],
    ['GitHub', 'GitHub'],
    ['GitLab', 'GitLab'],
    ['OpenAI', 'OpenAI'],
    ['LinkedIn', 'LinkedIn'],
    ['VS Code', 'VSCode'],
    ['Google Meet', 'GoogleMeet'],
    ['  Google  Meet  ', 'GoogleMeet'],
    ['Foo-Bar.Baz', 'FooBarBaz'],
  ])('%s → %s', (input, expected) => {
    expect(nameToPascal(input)).toBe(expected);
  });
});

describe('brandYearComponent', () => {
  it.each([
    [{ name: 'Apple', year: '1976' }, 'Apple1976Icon'],
    [{ name: 'VS Code', year: '2015' }, 'VSCode2015Icon'],
    [{ name: 'OpenAI', year: '2025' }, 'OpenAI2025Icon'],
  ])('%j → %s', (input, expected) => {
    expect(brandYearComponent(input)).toBe(expected);
  });
});

describe('brandYearFile', () => {
  it('matches the component name without the Icon suffix', () => {
    expect(brandYearFile({ name: 'Google', year: '2015' })).toBe('Google2015');
    expect(brandYearFile({ name: 'VS Code', year: '2015' })).toBe('VSCode2015');
  });
});
