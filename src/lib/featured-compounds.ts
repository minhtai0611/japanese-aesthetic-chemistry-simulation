/**
 * Catalog of featured compounds — used for quick suggestions,
 * generateStaticParams, and "related compounds". `has3D: false` flags a
 * substance PubChem DOES have properties for but has NO 3D conformer
 * (record_type=3d 404) — the page still renders 200, just showing an
 * explanatory banner instead of the 3D model.
 */
export const FEATURED_COMPOUNDS = [
  { name: "benzene", label: "Benzene — vòng thơm", has3D: true },
  { name: "caffeine", label: "Caffeine", has3D: true },
  { name: "aspirin", label: "Aspirin", has3D: true },
  { name: "glucose", label: "Glucose", has3D: true },
  { name: "water", label: "Nước", has3D: true },
  { name: "ethanol", label: "Ethanol", has3D: true },
  { name: "chlorophyll a", label: "Diệp lục", has3D: false },
  { name: "adenosine triphosphate", label: "ATP", has3D: true },
] as const;
