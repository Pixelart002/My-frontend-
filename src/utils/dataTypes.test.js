import { describe, expect, it } from 'vitest';
import {
  asBoolean,
  asFiniteNumber,
  asId,
  asInteger,
  asPositiveInteger,
  asTrimmedString,
} from './dataTypes';

describe('data type helpers', () => {
  it('keeps identifiers as strings', () => {
    expect(asId(123)).toBe('123');
    expect(asId('  abc-123  ')).toBe('abc-123');
    expect(asId('')).toBeNull();
  });

  it('accepts finite numeric values without coercing invalid values to zero', () => {
    expect(asFiniteNumber('12.50')).toBe(12.5);
    expect(asFiniteNumber(0)).toBe(0);
    expect(asFiniteNumber('not-a-number')).toBeNull();
  });

  it('normalizes integer inputs', () => {
    expect(asInteger('12.9')).toBe(12);
    expect(asPositiveInteger('3')).toBe(3);
    expect(asPositiveInteger('0')).toBe(1);
  });

  it('only coerces explicit boolean strings', () => {
    expect(asBoolean('true')).toBe(true);
    expect(asBoolean('false')).toBe(false);
    expect(asBoolean('1')).toBe(false);
    expect(asBoolean(null, true)).toBe(true);
  });

  it('trims string fields', () => {
    expect(asTrimmedString('  hello  ')).toBe('hello');
  });
});
