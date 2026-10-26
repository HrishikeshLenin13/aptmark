import {it,expect} from 'vitest';
import {calculate} from '../src/lib/calculator';
it('accepts explicit pi/e constants without weakening scientific notation',()=>{expect(calculate('pi^2')).toBe(Math.PI**2);expect(calculate('e^0')).toBe(1);expect(calculate('2e3')).toBe(2000);for(const value of ['pie','2pi','process'])expect(()=>calculate(value)).toThrow();});
it('evaluates nested absolute values and real cube roots',()=>{expect(calculate('abs(-4) + cbrt(-27)')).toBe(1);expect(calculate('sqrt(abs(-16))')).toBe(4);for(const value of ['abs2','cbrt()','abs(alert(1))'])expect(()=>calculate(value)).toThrow();});
it('rejects invalid intermediate values even when a later operator could mask them',()=>{for(const value of ['(1/0)^0','(1e308*1e308)^0','(1e309)^0','sqrt(-1)^0'])expect(()=>calculate(value)).toThrow();expect(calculate('0^0')).toBe(1);});
it('supports paired square grouping without accepting mismatched delimiters',()=>{expect(calculate('[2+(3*4)]/2')).toBe(7);for(const value of ['[2+3)','(2+3]','2[3]','[1'])expect(()=>calculate(value)).toThrow();});
