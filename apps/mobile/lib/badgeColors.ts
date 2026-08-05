import type { BadgeCategory, BadgeDef } from './badges';

export type BadgePalette = {
  /** Soft clay well fill */
  fill: string;
  /** Icon / number color */
  ink: string;
  /** Slightly deeper ink for titles when unlocked */
  title: string;
};

/** Soft pastel clay tones — muted enough for the lavender UI, varied enough to feel collectible */
const PALETTES: BadgePalette[] = [
  { fill: '#D5E0DC', ink: '#4F6F66', title: '#3A554E' }, // sage
  { fill: '#D4E4F2', ink: '#4A6F92', title: '#3A5874' }, // sky
  { fill: '#F0E0D6', ink: '#9A6550', title: '#7A4E3C' }, // peach
  { fill: '#E6D8F2', ink: '#6F5A92', title: '#564474' }, // lilac
  { fill: '#F0EBD4', ink: '#8A7340', title: '#6B5830' }, // butter
  { fill: '#F0D8E2', ink: '#9A5A72', title: '#7A4058' }, // rose
  { fill: '#D4EDE6', ink: '#3F7A62', title: '#2F5E4A' }, // mint
  { fill: '#D9E0EC', ink: '#556A88', title: '#415268' }, // slate
  { fill: '#F0DCD4', ink: '#A06452', title: '#7E4A3C' }, // coral
  { fill: '#D4EBEF', ink: '#3F7588', title: '#2F5A6A' }, // aqua
  { fill: '#E8DCC8', ink: '#8A6A40', title: '#6B5030' }, // sand
  { fill: '#E0D4EC', ink: '#7A5A98', title: '#5E4478' }, // violet
];

const CATEGORY_OFFSET: Record<BadgeCategory, number> = {
  collection: 0,
  streak: 2,
  type: 1,
  find: 3,
  quality: 4,
  habit: 6,
  special: 5,
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

const ULTIMATE_PALETTE: BadgePalette = {
  fill: '#E8D9A8',
  ink: '#8A6A20',
  title: '#6B5218',
};

/** Specimen-true soft clay colors for named finds */
const FIND_PALETTES: Record<string, BadgePalette> = {
  find_granite: { fill: '#E8E2DA', ink: '#8A7A68', title: '#6B5A48' },
  find_basalt: { fill: '#D8D6DC', ink: '#3A3A42', title: '#2A2A32' },
  volcanic_glass: { fill: '#DCD6E4', ink: '#1E1E28', title: '#14141C' },
  find_marble: { fill: '#F0ECE8', ink: '#9A8A92', title: '#6E6068' },
  find_limestone: { fill: '#EDE8DC', ink: '#A09070', title: '#7A6A50' },
  find_sandstone: { fill: '#F0E4D0', ink: '#B88850', title: '#8A6438' },
  find_slate: { fill: '#D8DCE4', ink: '#4A5568', title: '#384050' },
  find_quartz: { fill: '#E8EEF4', ink: '#7A90A8', title: '#5A7088' },
  find_quartzite: { fill: '#E4E8EC', ink: '#6A7888', title: '#505C68' },
  find_granodiorite: { fill: '#E0E0DC', ink: '#6A6A62', title: '#505048' },
  find_diorite: { fill: '#E4E4E4', ink: '#4A4A4A', title: '#333333' },
  find_schist: { fill: '#E4DED0', ink: '#7A6A48', title: '#5A4A30' },
  find_gneiss: { fill: '#E6E0D4', ink: '#7A7058', title: '#585040' },
  find_shale: { fill: '#E4DED4', ink: '#6A6050', title: '#4A4238' },
  find_flint: { fill: '#DCD8D0', ink: '#4A4838', title: '#323028' },
  find_scoria: { fill: '#E8D8D0', ink: '#8A4030', title: '#6A2E22' },
  find_amethyst: { fill: '#E6D8F2', ink: '#6B3F9A', title: '#54307A' },
  find_pyrite: { fill: '#F0EBD0', ink: '#B89620', title: '#8A7018' },
  find_emerald: { fill: '#CDE8D8', ink: '#2F7A55', title: '#246346' },
  find_magnetite: { fill: '#D8D8DC', ink: '#2A2A32', title: '#1A1A22' },
  find_hematite: { fill: '#E8D8D4', ink: '#8A3A32', title: '#6A2822' },
  find_fossil: { fill: '#E8E2D4', ink: '#8A7A58', title: '#6A5A40' },
  find_meteorite: { fill: '#E0DCD4', ink: '#5A5048', title: '#3E3630' },
  find_jade: { fill: '#D4E8DC', ink: '#3A7A58', title: '#2A5A40' },
  find_turquoise: { fill: '#D4E8E8', ink: '#2A8A8A', title: '#1E6A6A' },
  find_opal: { fill: '#E8E4F0', ink: '#7A6A98', title: '#5A4A78' },
  find_garnet: { fill: '#F0D8DC', ink: '#8A2A3A', title: '#6A1E2A' },
  find_feldspar: { fill: '#F0E8E0', ink: '#A08070', title: '#7A5E50' },
  find_mica: { fill: '#E8E4D8', ink: '#8A8048', title: '#6A6030' },
  find_pumice: { fill: '#E8E4DC', ink: '#9A9080', title: '#6E6658' },
};

/** Pick a stable, category-biased palette for a badge */
export function getBadgePalette(badge: Pick<BadgeDef, 'id' | 'category'>): BadgePalette {
  if (badge.id === 'master_geologist') return ULTIMATE_PALETTE;
  if (FIND_PALETTES[badge.id]) return FIND_PALETTES[badge.id];
  const base = CATEGORY_OFFSET[badge.category] ?? 0;
  const index = (base + hashId(badge.id)) % PALETTES.length;
  return PALETTES[index];
}

export const LOCKED_PALETTE: BadgePalette = {
  fill: '#DCD6E8',
  ink: '#8A85A8',
  title: '#8A85A8',
};
