import {it,expect} from 'vitest';
import {calculate} from '../src/lib/calculator';
it('accepts explicit pi/e constants without weakening scientific notation',()=>{expect(calculate('pi^2')).toBe(Math.PI**2);expect(calculate('e^0')).toBe(1);expect(calculate('2e3')).toBe(2000);for(const value of ['pie','2pi','process'])expect(()=>calculate(value)).toThrow();});
it('evaluates nested absolute values and real cube roots',()=>{expect(calculate('abs(-4) + cbrt(-27)')).toBe(1);expect(calculate('sqrt(abs(-16))')).toBe(4);for(const value of ['abs2','cbrt()','abs(alert(1))'])expect(()=>calculate(value)).toThrow();});
