/**
 * Scale factor that shrinks real 3D conformer coordinates (Å, from PubChem
 * record_type=3d) into the three.js display scene's units. Kept separate
 * from pubchem.ts (even though that's where it's first used) because
 * pubchem.ts dynamically imports `@/db` — any "use client" component that
 * imports a VALUE (not `import type`) from pubchem.ts drags pg/Node
 * builtins (fs/net/tls) into the browser bundle, breaking `next build`.
 * This pure-constant file is safe to import directly from both client
 * components and pubchem.ts.
 */
export const COORD_SCALE_3D = 0.62;
