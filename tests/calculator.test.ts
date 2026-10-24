import { describe, it, expect } from 'vitest';
import { calculate } from '../src/lib/calculator';

describe('study calculator', () => {
  it('accepts pasted mathematical operators with normal precedence', () => {
    expect(calculate('6 × (8 − 2) ÷ 3')).toBe(12);
    expect(calculate('−.5 × 4')).toBe(-2);
    expect(calculate('2 + 3 * 4')).toBe(14);
  });
});

it('rejects stray decimal points rather than silently changing the expression', () => {
  for (const input of ['1..+2', '.', '1+.', '2...*3', '1.2.3']) expect(() => calculate(input)).toThrow();
  expect(calculate('.5 + 1.')).toBe(1.5);
  expect(() => calculate('1 / 0')).toThrow();
});
