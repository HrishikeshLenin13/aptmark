import { it, expect } from 'vitest';
import { calculate } from '../src/lib/calculator';
it('handles powers with conventional unary precedence', () => { expect(calculate('2^3^2')).toBe(512); expect(calculate('-2^2')).toBe(-4); expect(calculate('(-2)^2')).toBe(4); expect(calculate('2^-2')).toBe(.25); expect(() => calculate('2^')).toThrow(); });
it('treats postfix percentages as division by 100', () => { expect(calculate('50% + 25%')).toBe(.75); expect(calculate('(2+3)%')).toBe(.05); expect(calculate('50%^2')).toBe(.25); });
it('supports square roots without evaluating identifiers', () => { expect(calculate('sqrt(144) + √(16)')).toBe(16); for (const input of ['sqrt(-1)','sqrt9','alert(1)']) expect(() => calculate(input)).toThrow(); });
it('accepts finite scientific notation and rejects incomplete exponents', () => { expect(calculate('1e3 * 2E-2')).toBe(20); expect(calculate('.5e+2')).toBe(50); for (const input of ['1e','1e+','1e309']) expect(() => calculate(input)).toThrow(); });
it('rejects whitespace-split literals but permits spaced operators', () => { for (const value of ['1 2','1 .2','1 e3','1e -3']) expect(() => calculate(value)).toThrow(); expect(calculate('1 + 2')).toBe(3); expect(calculate('sqrt ( 9 )')).toBe(3); });
