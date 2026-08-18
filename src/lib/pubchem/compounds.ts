import { callPug, compoundPath, numberOrNull } from "./core";

export interface Compound {
  cid: number;
  queryName: string;
  formula: string | null;
  molarMass: number | null; // g/mol
  exactMass: number | null;
  iupac: string | null;
  smiles: string | null;
  inchikey: string | null;
  xLogP: number | null;
  tpsa: number | null;
  hbd: number | null;
  hba: number | null;
  rotatableBonds: number | null;
  complexity: number | null;
}

interface PropertyTableResponse {
  PropertyTable: {
    Properties: {
      CID: number;
      MolecularFormula?: string;
      MolecularWeight?: string;
      ExactMass?: string;
      IUPACName?: string;
      ConnectivitySMILES?: string;
      SMILES?: string;
      InChIKey?: string;
      XLogP?: number;
      TPSA?: number;
      HBondDonorCount?: number;
      HBondAcceptorCount?: number;
      RotatableBondCount?: number;
      Complexity?: number;
    }[];
  };
}

/**
 * Tries each lookup variant of a slug in turn (see `lookupVariants` in
 * substance-identification.ts) until PubChem returns data — stops at the first
 * matching variant. Shared by both the compound page and the OG image, so each
 * one doesn't try a different variant and end up with mismatched results.
 */
export async function fetchCompoundByVariant(
  variants: readonly string[],
): Promise<{ matchedKeyword: string; compound: Compound | null }> {
  for (const variant of variants) {
    const compound = await fetchCompound(variant);
    if (compound) return { matchedKeyword: variant, compound };
  }
  return { matchedKeyword: variants[0], compound: null };
}

export async function fetchCompound(name: string): Promise<Compound | null> {
  const data = await callPug<PropertyTableResponse>(
    `/pug/compound/${compoundPath(name)}/property/MolecularFormula,MolecularWeight,ExactMass,IUPACName,ConnectivitySMILES,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity/JSON`,
  );
  const p = data?.PropertyTable?.Properties?.[0];
  if (!p) return null;
  return {
    cid: p.CID,
    queryName: name,
    formula: p.MolecularFormula ?? null,
    molarMass: numberOrNull(p.MolecularWeight ?? ""),
    exactMass: numberOrNull(p.ExactMass ?? ""),
    iupac: p.IUPACName ?? null,
    smiles: p.ConnectivitySMILES ?? p.SMILES ?? null,
    inchikey: p.InChIKey ?? null,
    xLogP: p.XLogP ?? null,
    tpsa: p.TPSA ?? null,
    hbd: p.HBondDonorCount ?? null,
    hba: p.HBondAcceptorCount ?? null,
    rotatableBonds: p.RotatableBondCount ?? null,
    complexity: p.Complexity ?? null,
  };
}
