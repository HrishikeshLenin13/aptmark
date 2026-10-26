import {it as test} from 'vitest';
import assert from 'node:assert/strict';
import {calculate} from '../src/lib/calculator';

test("split-exponent-digits-do-not-merge", () => {
for(const source of ["1e -2", "1e+ 2", "2 E3"]) assert.throws(()=>calculate(source));
});
