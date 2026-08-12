# ADR 0004 — Balancing equations with linear algebra, no external library

## Context

The "Equation Balancing" lab (`/experiments/equilibrium`) takes the
left/right side of a chemical reaction (e.g. `KMnO4 + HCl` → `KCl + MnCl2 +
Cl2 + H2O`) and must return the correct smallest set of positive integer
coefficients — no guessing, no calling a language model to "suggest" an
answer that merely sounds plausible.

npm packages for balancing chemical equations exist, but most use
floating-point numbers internally to solve the underlying linear system —
a real risk of accumulated error at exactly the most critical step: Gaussian
elimination on a matrix that can be nearly singular, where floating-point
error can turn a correct coefficient into an approximation (e.g.
`2.0000000003` instead of `2`), which then gets rounded incorrectly.

## Decision

Write a custom solver using **exact rational arithmetic**
(`src/lib/chemistry/equilibrium.ts`):

1. Build matrix `A` (rows = elements, columns = substances; right-hand-side
   coefficients carry a negative sign) using the formula parser that already
   exists (`parseFormula`) — no separate chemistry parsing logic for this
   module.
2. Solve the homogeneous system `A·x = 0` via Gauss-Jordan elimination, but
   with **every operation performed on `bigint`/`bigint` fractions** (a
   custom `Fraction` class) — addition/subtraction/multiplication/division
   of fractions keeps the numerator/denominator form intact and is never
   coerced to an intermediate floating-point number. No step can accumulate
   floating-point error, because no floating-point number is ever involved.
3. Once a solution is found (the solution space is exactly 1-dimensional —
   a necessary condition for a chemical equation to be balanceable at all),
   the fractions are put over a common denominator (LCM) and then reduced by
   their greatest common divisor (GCD) — producing the smallest positive
   integer coefficients, exactly what a textbook expects.
4. A solution with a negative sign or mixed signs is explicitly rejected
   (`return null`) — that's a sign the equation cannot be balanced with
   exactly the given substances, not a bug to hide.

## Why not use an external library

- **100% verifiable:** the classical algorithms (Gauss-Jordan elimination,
  LCM/GCD) fit in a single file, readable start to finish, tested against 50
  real equations from the Vietnamese high-school chemistry curriculum
  (`tests/unit/equilibrium.test.ts`) — checked by verifying element
  conservation on both sides for each solution, not just by comparing
  against hand-copied expected coefficients (easy to get wrong when
  transcribing).
- **No new runtime dependency** to track for security vulnerabilities or
  breaking changes in a future update, for a problem small enough to
  implement and verify correctly in-house.
- **Exact arithmetic** eliminates entirely the class of "approximate
  coefficient" bug that a library using internal floating-point could hit on
  a near-singular matrix — important for an educational product where
  *every* displayed number must be exactly correct, not merely "close
  enough".

## Consequences

- BigInt literals (`0n`/`1n`) aren't usable because the repo's
  `tsconfig.json` targets ES2017 (older than ES2020) — every BigInt constant
  is written with the `BigInt(0)`/`BigInt(1)` constructor instead of literal
  syntax.
- This same solver is reused as the source of "exactly correct answer" for
  the equation-balancing practice-problem generator (Phase 7,
  `generateBalancingProblem`) — one algorithm, two features, with no second
  copy of the logic that could drift out of sync.
