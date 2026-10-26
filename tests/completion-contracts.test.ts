import {it as test} from 'vitest';
import assert from 'node:assert/strict';
import {calculate} from '../src/lib/calculator';

test("split-exponent-digits-do-not-merge", () => {
for(const source of ["1e -2", "1e+ 2", "2 E3"]) assert.throws(()=>calculate(source));
});

test("power-associates-inside-nested-groups", () => {
assert.equal(calculate("2^(1+2^2)"), 32);
});

test("negative-exponent-binds-after-unary", () => {
assert.equal(calculate("-2^-3"), -0.125);
});

test("parenthesized-negative-base-odd-power", () => {
assert.equal(calculate("(-3)^3"), -27);
});

test("parenthesized-negative-base-even-power", () => {
assert.equal(calculate("(-3)^4"), 81);
});

test("percentage-binds-to-base-before-power", () => {
assert.equal(calculate("200%^3"), 8);
});

test("percentage-applies-to-a-completed-group", () => {
assert.equal(calculate("(50+50)%"), 1);
});

test("repeated-percentage-is-explicit-scaling", () => {
assert.equal(calculate("100%%"), 0.01);
});
