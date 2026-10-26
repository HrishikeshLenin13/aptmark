# Constrained calculator expressions

This guide covers implemented behavior. It does not change deployment or account configuration.

## Usage

```ts
import { calculate } from './src/lib/calculator';
calculate('2^3^2'); // 512: powers associate right
calculate('-2^2'); // -4: power binds before unary minus
calculate('sqrt(144) + 50% + 1e-2'); // 12.51
```

## Contracts and limits

- Postfix percent divides its operand by 100; it does not implement spreadsheet-style contextual percentage addition.
- sqrt(...) and the square-root symbol accept parenthesized expressions. Negative roots and nonfinite results fail.
- Scientific literals accept e/E with an optional signed exponent. Whitespace may surround operators but must not split a number.
- The calculator remains a constrained parser, not JavaScript evaluation. These changes do not alter SAT answer keys, scoring, or publication status.

## Source map

- [`src/lib/calculator.ts`](../src/lib/calculator.ts)
<!-- source: src/lib/calculator.ts -->
- [`tests/calculator-round2.test.ts`](../tests/calculator-round2.test.ts)
<!-- source: tests/calculator-round2.test.ts -->
- [`IMPLEMENTATION_STATUS.md`](../IMPLEMENTATION_STATUS.md)
<!-- source: IMPLEMENTATION_STATUS.md -->

## Regression command

Run from the repository root:

```sh
npm test && npm run typecheck
```


## Extended closed grammar

Explicit constants `pi` and `e`, `abs`, `cbrt`, `floor`, `ceil`, and `round` are supported. Scientific literals such as `2e3` retain their numeric meaning; `2*pi` requires explicit multiplication. Square brackets may group expressions, but bracket types must match. Every intermediate operation must remain a finite real number, so `(1/0)^0` is rejected instead of hiding division by zero. Rounding follows JavaScript Math semantics. No arbitrary function lookup or evaluation is used.
