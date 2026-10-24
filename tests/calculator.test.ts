import { describe, it, expect } from 'vitest';
import { calculate } from '../src/lib/calculator';

describe('study calculator', () => {
  it('accepts pasted mathematical operators with normal precedence', () => {
    expect(calculate('6 × (8 − 2) ÷ 3')).toBe(12);
    expect(calculate('−.5 × 4')).toBe(-2);
    expect(calculate('2 + 3 * 4')).toBe(14);
  });
});
