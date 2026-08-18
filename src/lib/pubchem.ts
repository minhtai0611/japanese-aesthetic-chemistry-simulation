/**
 * REAL DATA LAYER — PUBCHEM PUG-REST (NCBI, public, no API key required).
 *
 * Re-exports the split pubchem/* submodules under the original module path so
 * existing imports (`@/lib/pubchem`) don't need to change. See
 * src/lib/pubchem/core.ts for the shared fetch core and transparency statement.
 */

export type { PugResult } from "./pubchem/core";
export { callPugSafely } from "./pubchem/core";
export * from "./pubchem/elements";
export * from "./pubchem/compounds";
export * from "./pubchem/conformers";
export * from "./pubchem/suggestions";
