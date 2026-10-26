import { it, expect } from 'vitest';
import { calculate } from '../src/lib/calculator';
it('handles powers with conventional unary precedence', () => { expect(calculate('2^3^2')).toBe(512); expect(calculate('-2^2')).toBe(-4); expect(calculate('(-2)^2')).toBe(4); expect(calculate('2^-2')).toBe(.25); expect(() => calculate('2^')).toThrow(); });
