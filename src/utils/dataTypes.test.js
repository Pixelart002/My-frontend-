import { describe, expect, it } from 'vitest';

import {
  asBoolean,
  asFiniteNumber,
  asId,
  asInteger,
  asNonNegativeInteger,
  asPositiveInteger,
  asTrimmedString,
} from './dataTypes';

describe('data type helpers', () => {
  it('keeps identifiers as strings', () => {
    expect(asId(123)).toBe('123');
    expect(asId('  abc-123  ')).toBe('abc-123');
    expect(asId('')).toBeNull();
    expect(asId(null)).toBeNull();
    expect(asId(undefined)).toBeNull();
  });
  
  it('accepts finite numeric values without coercing invalid values to zero', () => {
    expect(asFiniteNumber('12.50')).toBe(12.5);
    expect(asFiniteNumber(0)).toBe(0);
    expect(asFiniteNumber(-5.25)).toBe(-5.25);
    expect(asFiniteNumber('not-a-number')).toBeNull();
    expect(asFiniteNumber('')).toBeNull();
    expect(asFiniteNumber(Infinity)).toBeNull();
  });
  
  it('accepts only actual integers', () => {
    expect(asInteger('12')).toBe(12);
    expect(asInteger(12)).toBe(12);
    expect(asInteger('12.9')).toBeNull();
    expect(asInteger(12.9)).toBeNull();
    expect(asInteger('invalid')).toBeNull();
  });
  
  it('validates positive integers without inventing a fallback', () => {
    expect(asPositiveInteger('3')).toBe(3);
    expect(asPositiveInteger(10)).toBe(10);
    expect(asPositiveInteger('0')).toBeNull();
    expect(asPositiveInteger('-1')).toBeNull();
    expect(asPositiveInteger('3.5')).toBeNull();
    expect(asPositiveInteger('invalid')).toBeNull();
  });
  
  it('supports explicit positive-integer fallbacks', () => {
    expect(asPositiveInteger(undefined, 1)).toBe(1);
    expect(asPositiveInteger('invalid', 1)).toBe(1);
    expect(asPositiveInteger('0', 5)).toBe(5);
    expect(asPositiveInteger('3', 1)).toBe(3);
  });
  
  it('validates non-negative integers', () => {
    expect(asNonNegativeInteger(0)).toBe(0);
    expect(asNonNegativeInteger('10')).toBe(10);
    expect(asNonNegativeInteger('-1')).toBeNull();
    expect(asNonNegativeInteger('2.5')).toBeNull();
  });
  
  it('only coerces explicit boolean strings', () => {
    expect(asBoolean(true)).toBe(true);
    expect(asBoolean(false)).toBe(false);
    expect(asBoolean('true')).toBe(true);
    expect(asBoolean(' TRUE ')).toBe(true);
    expect(asBoolean('false')).toBe(false);
    expect(asBoolean('1')).toBe(false);
    expect(asBoolean('yes')).toBe(false);
    expect(asBoolean(null, true)).toBe(true);
  });
  
  it('trims string fields', () => {
    expect(asTrimmedString('  hello  ')).toBe('hello');
    expect(asTrimmedString('')).toBe('');
    expect(asTrimmedString(null)).toBe('');
  });
});