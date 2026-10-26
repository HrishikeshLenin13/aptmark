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

