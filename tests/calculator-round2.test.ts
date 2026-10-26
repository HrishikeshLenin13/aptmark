import { it, expect } from 'vitest';
import { calculate } from '../src/lib/calculator';
it('handles powers with conventional unary precedence', () => { expect(calculate('2^3^2')).toBe(512); expect(calculate('-2^2')).toBe(-4); expect(calculate('(-2)^2')).toBe(4); expect(calculate('2^-2')).toBe(.25); expect(() => calculate('2^')).toThrow(); });
it('treats postfix percentages as division by 100', () => { expect(calculate('50% + 25%')).toBe(.75); expect(calculate('(2+3)%')).toBe(.05); expect(calculate('50%^2')).toBe(.25); });
