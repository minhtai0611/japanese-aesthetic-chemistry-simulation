# ADR 0001 — Data confidence tier: distinguishing measured vs. predicted

## Context

PubChem returns physical state and electron configuration for all 118
elements via `/rest/pug/periodictable/JSON`, including synthetic superheavy
elements (Z ≥ 104) that have never been observed in a quantity large enough
to measure directly. For these elements, PubChem doesn't leave the
`StandardState` field blank — instead it spells it out in words, e.g.
`"Expected to be a Solid"` instead of `"Solid"`.

If the website displayed every element the same way ("Oganesson: Solid"),
that would fabricate a certainty PubChem never actually claims — a violation
of the project's "zero fabricated data points" principle.

## Decision

Derive the confidence level **directly from PubChem's own wording**, instead
of a hard-coded list of "26 elements we can't measure":

```ts
// src/lib/pubchem.ts
function confidenceFromOriginalState(raw: string): ElementInfo["trangThaiCertainty"] {
  if (!raw) return "chua-xac-dinh";
  return /expected/i.test(raw) ? "du-doan" : "do-dac";
}
```

The same function derives both `trangThaiCertainty` (physical state) and
`cauHinhElectronCertainty` (electron configuration) — because both come from
the same source signal (`StandardState`), rather than two independent lookup
tables that could drift out of sync whenever PubChem updates its data.

Three possible outcomes:
- `"do-dac"` ("measured") — PubChem states it outright, no "expected" wording
- `"du-doan"` ("predicted") — PubChem itself labels it "expected" (inferred, not measured)
- `"chua-xac-dinh"` ("undetermined") — field is empty, no basis to say anything

The UI reflects this accordingly: the periodic table marks the atomic number
with a `*`, the `/element/[symbol]` page states "Predicted: …" ahead of the
state name, and the phase-change lab (Phase 6, §9.7) locks selection — while
still listing, with an annotation — elements lacking measured melting/boiling
data.

## Why not hard-code it

A hand-maintained list of "predicted elements" would:
1. Drift out of date the moment PubChem manages to measure a new element
   (Z=119, 120... actively being pursued by labs) — someone has to remember
   to update it, and that's easy to forget.
2. Be exactly the kind of "fabricated data point" the project has committed
   not to produce — labeling an element "predicted" without grounding that
   label in an actual signal from the source.

Deriving it directly from the source wording means the "predicted" label
always matches what PubChem *actually* says at query time — automatically
correct whenever the source updates, with no code change required.

## Consequences

- Adding a third state (`"chua-xac-dinh"`) forces every display site to
  explicitly handle the "no data" case instead of implicitly treating it as
  `false`/measured.
- This approach only works because PubChem encodes confidence directly in
  its response wording — a different API without an equivalent convention
  would need a different inference strategy (e.g. cross-referencing multiple
  sources).
