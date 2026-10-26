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

test("scientific-negative-exponent-with-unary", () => {
assert.equal(calculate("-2.5e-2"), -0.025);
});

test("scientific-plus-sign-does-not-start-addition", () => {
assert.equal(calculate("1e+2+3"), 103);
});

test("scientific-uppercase-exponent-in-products", () => {
assert.equal(calculate("2E3/4E1"), 50);
});

test("decimal-leading-dot-in-function", () => {
assert.equal(calculate("abs(-.5)"), 0.5);
});

test("decimal-trailing-dot-remains-numeric", () => {
assert.equal(calculate("12. + 3"), 15);
});

test("constant-e-with-spaced-subtraction", () => {
assert.equal(calculate("e - e"), 0);
});

test("constant-pi-inside-root", () => {
assert.equal(calculate("sqrt(pi^2)"), Math.PI);
});

test("nested-real-cube-root", () => {
assert.equal(calculate("cbrt(cbrt(-19683))"), -3);
});

test("absolute-value-of-a-difference", () => {
assert.equal(calculate("abs(3-8)"), 5);
});

test("floor-respects-negative-fractions", () => {
assert.equal(calculate("floor(-2.01)"), -3);
});

test("ceil-respects-positive-fractions", () => {
assert.equal(calculate("ceil(2.01)"), 3);
});

test("round-ties-follow-the-documented-math-rule", () => {
assert.equal(calculate("round(-1.5)"), -1);
});

test("rounding-result-can-be-used-as-an-exponent", () => {
assert.equal(calculate("2^round(2.8)"), 8);
});

test("square-and-round-groups-can-nest", () => {
assert.equal(calculate("[2*(3+[4-1])]"), 12);
});

test("pasted-multiplication-and-division-normalize", () => {
assert.equal(calculate("12 \u00d7 3 \u00f7 4"), 9);
});
