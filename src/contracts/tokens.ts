/**
 * Canonical W.E.B. Du Bois 1900 Paris Exposition design tokens for controls,
 * plates, showcase, and automated conformance verification.
 */

export const DUBOIS_SURFACES = {
  parchment: '#F4EFE6',
  vellum: '#EAE2D3',
  warmTan: '#D2B48C',
  unfocused: '#DED6C6',
  ink: '#1A1615',
  charcoal: '#52493E',
  guideline: '#8C7A6B',
} as const;

export const DUBOIS_PALETTE_A = [
  '#DC143C', // Exhibition Crimson
  '#2B5B84', // Paris Cobalt
  '#008055', // Viridian Emerald
  '#FFD700', // Atlanta Gold
  '#E87722', // Ochre Orange
  '#753ABD', // Royal Violet
  '#00A7B5', // Archival Teal
  '#654321', // Burnt Umber
  '#D2B48C', // Warm Tan
] as const;

export interface SequentialStepColor {
  readonly full: string;
  readonly tint: string;
  readonly highlight: string;
}

export const DUBOIS_PALETTE_B: readonly SequentialStepColor[] = [
  { full: '#A50050', tint: '#C96B8E', highlight: '#FFD700' },
  { full: '#DC143C', tint: '#E67384', highlight: '#FFD700' },
  { full: '#EE5340', tint: '#F09583', highlight: '#FFD700' },
  { full: '#FFA400', tint: '#F5C16C', highlight: '#EAE2D3' },
  { full: '#FFCD00', tint: '#F7DB7C', highlight: '#DC143C' },
  { full: '#FAE053', tint: '#F6E89E', highlight: '#2B5B84' },
  { full: '#DBE442', tint: '#E4E895', highlight: '#008055' },
  { full: '#8FD14F', tint: '#BBE094', highlight: '#008055' },
  { full: '#00A651', tint: '#6FC493', highlight: '#FFD700' },
  { full: '#007A5E', tint: '#6BA896', highlight: '#FFD700' },
  { full: '#00A7B5', tint: '#74C7CE', highlight: '#FFD700' },
  { full: '#2B5B84', tint: '#7E98AF', highlight: '#FFD700' },
  { full: '#6638B6', tint: '#A187CE', highlight: '#FFD700' },
  { full: '#AF3BC9', tint: '#CCA3D9', highlight: '#FFD700' },
] as const;

export const DUBOIS_ALL_TOKEN_HEXES: ReadonlySet<string> = new Set([
  ...Object.values(DUBOIS_SURFACES),
  ...DUBOIS_PALETTE_A,
  ...DUBOIS_PALETTE_B.flatMap((s) => [s.full, s.tint, s.highlight]),
]);
