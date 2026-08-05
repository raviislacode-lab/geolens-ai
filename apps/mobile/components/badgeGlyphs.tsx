import React from 'react';
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

type GlyphProps = { size: number; color: string; accent?: string };

function SpeckledRock({ size, color, accent = '#F5F0E8' }: GlyphProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      <Ellipse cx="20" cy="21" rx="15" ry="13" fill={color} />
      <Circle cx="12" cy="16" r="2.2" fill={accent} />
      <Circle cx="22" cy="14" r="1.8" fill="#2A2A2A" opacity={0.55} />
      <Circle cx="27" cy="20" r="2.4" fill={accent} />
      <Circle cx="15" cy="24" r="1.6" fill="#2A2A2A" opacity={0.45} />
      <Circle cx="24" cy="27" r="1.9" fill={accent} opacity={0.9} />
      <Circle cx="18" cy="18" r="1.3" fill="#2A2A2A" opacity={0.35} />
    </Svg>
  );
}

function DarkMass({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M8 22 C8 12, 14 8, 20 8 C28 8, 33 14, 33 22 C33 30, 27 34, 20 34 C12 34, 8 29, 8 22 Z"
        fill={color}
      />
    </Svg>
  );
}

function ObsidianShard({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Polygon points="20,4 34,30 20,36 6,28" fill={color} />
      <Polygon points="20,8 28,26 20,30 14,24" fill="rgba(255,255,255,0.18)" />
    </Svg>
  );
}

function LayeredRock({
  size,
  color,
  accent = 'rgba(255,255,255,0.35)',
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x="7" y="10" width="26" height="5" rx="1.5" fill={color} />
      <Rect x="7" y="17" width="26" height="5" rx="1.5" fill={accent} />
      <Rect x="7" y="24" width="26" height="5" rx="1.5" fill={color} opacity={0.85} />
    </Svg>
  );
}

function BandedRock({ size, color, accent = '#EDE8DF' }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx="20" cy="20" rx="14" ry="12" fill={color} />
      <Path d="M8 16 Q20 12 32 16" stroke={accent} strokeWidth="2.5" fill="none" />
      <Path d="M8 22 Q20 18 32 22" stroke={accent} strokeWidth="2.2" fill="none" />
      <Path d="M9 28 Q20 24 31 28" stroke={accent} strokeWidth="2" fill="none" />
    </Svg>
  );
}

function CrystalPoint({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Polygon points="20,4 30,16 30,32 20,38 10,32 10,16" fill={color} />
      <Polygon points="20,8 26,16 26,28 20,33 14,28 14,16" fill="rgba(255,255,255,0.28)" />
    </Svg>
  );
}

function EmeraldCut({ size, color }: GlyphProps) {
  const w = 40;
  const h = 32;
  return (
    <Svg width={size} height={size * 0.8} viewBox={`0 0 ${w} ${h}`}>
      <Polygon
        points="9,3 31,3 38,10 38,22 31,29 9,29 2,22 2,10"
        fill={color}
      />
      <Polygon
        points="12,8 28,8 33,13 33,19 28,24 12,24 7,19 7,13"
        fill="rgba(255,255,255,0.28)"
      />
    </Svg>
  );
}

function AmethystCluster({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Polygon points="9,14 14,18 14,30 9,34 4,30 4,18" fill={color} opacity={0.75} />
      <Polygon points="31,14 36,18 36,30 31,34 26,30 26,18" fill={color} opacity={0.75} />
      <Polygon points="20,3 29,12 29,30 20,38 11,30 11,12" fill={color} />
      <Polygon points="20,8 25,14 25,26 20,32 15,26 15,14" fill="rgba(255,255,255,0.3)" />
    </Svg>
  );
}

function PyriteCube({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Polygon points="10,14 22,8 34,14 22,20" fill={color} opacity={0.9} />
      <Polygon points="10,14 22,20 22,34 10,28" fill={color} />
      <Polygon points="22,20 34,14 34,28 22,34" fill={color} opacity={0.7} />
    </Svg>
  );
}

function Vesicular({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M9 20 C9 11, 14 7, 20 7 C28 7, 33 13, 33 21 C33 30, 27 35, 19 35 C11 35, 9 28, 9 20 Z"
        fill={color}
      />
      <Circle cx="14" cy="16" r="2.2" fill="rgba(255,255,255,0.35)" />
      <Circle cx="24" cy="14" r="1.6" fill="rgba(255,255,255,0.3)" />
      <Circle cx="20" cy="24" r="2.5" fill="rgba(255,255,255,0.28)" />
      <Circle cx="28" cy="25" r="1.8" fill="rgba(255,255,255,0.25)" />
    </Svg>
  );
}

function FlintChip({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Polygon points="8,12 26,6 34,18 28,34 10,30 6,20" fill={color} />
      <Polygon points="12,14 24,10 28,18 22,28 12,24" fill="rgba(255,255,255,0.2)" />
    </Svg>
  );
}

function Octahedron({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Polygon points="20,4 34,20 20,36 6,20" fill={color} />
      <Polygon points="20,4 34,20 20,20" fill="rgba(255,255,255,0.22)" />
    </Svg>
  );
}

function HematiteDisc({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx="20" cy="20" rx="14" ry="12" fill={color} />
      <Ellipse cx="16" cy="16" rx="5" ry="3.5" fill="rgba(255,255,255,0.22)" />
    </Svg>
  );
}

function FossilSpiral({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="14" fill={color} opacity={0.35} />
      <Path
        d="M20 10 C28 10 30 16 26 20 C22 24 18 22 18 18 C18 15 21 14 23 16"
        stroke={color}
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="23" cy="17" r="2" fill={color} />
    </Svg>
  );
}

function Meteorite({ size, color, accent = '#8A7A6A' }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M12 10 L28 8 L34 18 L30 32 L14 34 L6 22 Z"
        fill={color}
      />
      <Circle cx="16" cy="18" r="2" fill={accent} opacity={0.7} />
      <Circle cx="24" cy="22" r="1.6" fill={accent} opacity={0.6} />
      <Circle cx="20" cy="28" r="1.4" fill={accent} opacity={0.5} />
    </Svg>
  );
}

function Cabochon({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx="20" cy="21" rx="12" ry="14" fill={color} />
      <Ellipse cx="16" cy="15" rx="4" ry="2.5" fill="rgba(255,255,255,0.35)" />
    </Svg>
  );
}

function Nugget({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M10 18 C12 10, 20 8, 26 10 C32 12, 34 20, 30 26 C26 33, 16 34, 11 28 C7 23, 8 20, 10 18 Z"
        fill={color}
      />
      <Ellipse cx="16" cy="16" rx="3" ry="2" fill="rgba(255,255,255,0.3)" />
    </Svg>
  );
}

function Opal({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx="20" cy="20" rx="13" ry="11" fill={color} />
      <Circle cx="14" cy="16" r="2" fill="#7EC8E3" opacity={0.7} />
      <Circle cx="22" cy="14" r="1.6" fill="#E39AD6" opacity={0.65} />
      <Circle cx="26" cy="22" r="2.2" fill="#8FD4A8" opacity={0.6} />
      <Circle cx="17" cy="24" r="1.5" fill="#F0D878" opacity={0.55} />
    </Svg>
  );
}

function Garnet({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Polygon points="20,5 30,12 33,24 26,34 14,34 7,24 10,12" fill={color} />
      <Polygon points="20,9 27,14 28,22 20,20" fill="rgba(255,255,255,0.25)" />
    </Svg>
  );
}

function CleavageBlock({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x="9" y="10" width="22" height="20" rx="2" fill={color} />
      <Path d="M9 17 H31" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <Path d="M9 24 H31" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
    </Svg>
  );
}

function FlakySheets({ size, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx="20" cy="14" rx="13" ry="4" fill={color} opacity={0.7} />
      <Ellipse cx="20" cy="20" rx="14" ry="4.5" fill={color} />
      <Ellipse cx="20" cy="26" rx="12" ry="4" fill={color} opacity={0.8} />
    </Svg>
  );
}

function Marble({ size, color, accent = 'rgba(120,100,120,0.35)' }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx="20" cy="20" rx="14" ry="13" fill={color} />
      <Path d="M10 14 Q18 18 14 26" stroke={accent} strokeWidth="2" fill="none" />
      <Path d="M18 10 Q26 20 22 30" stroke={accent} strokeWidth="1.8" fill="none" />
      <Path d="M26 14 Q30 22 24 28" stroke={accent} strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

/** Specimen-specific glyph for named-find badges */
export function FindBadgeGlyph({
  id,
  size,
  color,
}: {
  id: string;
  size: number;
  color: string;
}) {
  const props = { size, color };

  switch (id) {
    case 'find_granite':
      return <SpeckledRock {...props} accent="#F2EDE4" />;
    case 'find_granodiorite':
      return <SpeckledRock {...props} accent="#E8E4DC" />;
    case 'find_diorite':
      return <SpeckledRock {...props} accent="#F5F5F5" />;
    case 'find_basalt':
      return <DarkMass {...props} />;
    case 'volcanic_glass':
      return <ObsidianShard {...props} />;
    case 'find_marble':
      return <Marble {...props} />;
    case 'find_limestone':
      return <LayeredRock {...props} accent="rgba(255,255,255,0.45)" />;
    case 'find_sandstone':
      return <LayeredRock {...props} accent="rgba(210,180,140,0.7)" />;
    case 'find_slate':
      return <LayeredRock {...props} accent="rgba(255,255,255,0.2)" />;
    case 'find_shale':
      return <LayeredRock {...props} accent="rgba(160,140,110,0.55)" />;
    case 'find_schist':
      return <FlakySheets {...props} />;
    case 'find_gneiss':
      return <BandedRock {...props} accent="#EDE8DF" />;
    case 'find_quartz':
    case 'find_quartzite':
      return <CrystalPoint {...props} />;
    case 'find_emerald':
      return <EmeraldCut {...props} />;
    case 'find_amethyst':
      return <AmethystCluster {...props} />;
    case 'find_pyrite':
      return <PyriteCube {...props} />;
    case 'find_scoria':
      return <Vesicular {...props} />;
    case 'find_pumice':
      return <Vesicular {...props} />;
    case 'find_flint':
      return <FlintChip {...props} />;
    case 'find_magnetite':
      return <Octahedron {...props} />;
    case 'find_hematite':
      return <HematiteDisc {...props} />;
    case 'find_fossil':
      return <FossilSpiral {...props} />;
    case 'find_meteorite':
      return <Meteorite {...props} />;
    case 'find_jade':
      return <Cabochon {...props} />;
    case 'find_turquoise':
      return <Nugget {...props} />;
    case 'find_opal':
      return <Opal {...props} />;
    case 'find_garnet':
      return <Garnet {...props} />;
    case 'find_feldspar':
      return <CleavageBlock {...props} />;
    case 'find_mica':
      return <FlakySheets {...props} />;
    default:
      return <DarkMass {...props} />;
  }
}

export function hasFindGlyph(id: string): boolean {
  return (
    id.startsWith('find_') ||
    id === 'volcanic_glass'
  );
}
