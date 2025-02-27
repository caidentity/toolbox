interface GradientPoint {
  x: number;
  y: number;
  color: string;
  intensity: number;
  bend: number;
  elongation: number;
  rotation: number;
  sBend: number;
}

interface GradientPreset {
  name: string;
  points: GradientPoint[];
}

// Helper to convert HSL to hex
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Parse HSL from string like "hsla(28, 100%, 74%, 1)"
function parseHSL(hsl: string): string {
  const matches = hsl.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
  if (!matches) return '#ffffff';
  return hslToHex(
    parseInt(matches[1]), 
    parseInt(matches[2]), 
    parseInt(matches[3])
  );
}

export const gradientPresets: GradientPreset[] = [
  {
    name: "Rainbow Arc",
    points: [
      { x: 0.0, y: 0.0, color: parseHSL("hsla(296, 77%, 74%, 1)"), intensity: 0.35, bend: 2.0, elongation: 1.2, rotation: 0, sBend: 0 },
      { x: 0.2, y: 0.0, color: parseHSL("hsla(237, 77%, 74%, 1)"), intensity: 0.35, bend: 2.0, elongation: 1.2, rotation: 0, sBend: 0 },
      { x: 0.4, y: 0.0, color: parseHSL("hsla(187, 77%, 74%, 1)"), intensity: 0.35, bend: 2.0, elongation: 1.2, rotation: 0, sBend: 0 },
      { x: 0.6, y: 0.0, color: parseHSL("hsla(127, 77%, 74%, 1)"), intensity: 0.35, bend: 2.0, elongation: 1.2, rotation: 0, sBend: 0 },
      { x: 0.8, y: 0.0, color: parseHSL("hsla(62, 77%, 74%, 1)"), intensity: 0.35, bend: 2.0, elongation: 1.2, rotation: 0, sBend: 0 },
      { x: 1.0, y: 0.0, color: parseHSL("hsla(24, 77%, 74%, 1)"), intensity: 0.35, bend: 2.0, elongation: 1.2, rotation: 0, sBend: 0 }
    ]
  },
  {
    name: "Sunset Vibes",
    points: [
      { x: 0.4, y: 0.2, color: parseHSL("hsla(28, 100%, 74%, 1)"), intensity: 1.2, bend: 3.0, elongation: 1.5, rotation: 0, sBend: 0 },
      { x: 0.8, y: 0.0, color: parseHSL("hsla(189, 100%, 56%, 1)"), intensity: 1.0, bend: 2.5, elongation: 1.3, rotation: 0, sBend: 0 },
      { x: 0.0, y: 0.5, color: parseHSL("hsla(355, 100%, 93%, 1)"), intensity: 0.8, bend: 2.0, elongation: 1.2, rotation: 0, sBend: 0 },
      { x: 0.8, y: 0.5, color: parseHSL("hsla(340, 100%, 76%, 1)"), intensity: 1.1, bend: 3.0, elongation: 1.4, rotation: 0, sBend: 0 },
      { x: 0.0, y: 1.0, color: parseHSL("hsla(22, 100%, 77%, 1)"), intensity: 0.9, bend: 2.8, elongation: 1.3, rotation: 0, sBend: 0 },
      { x: 0.8, y: 1.0, color: parseHSL("hsla(242, 100%, 70%, 1)"), intensity: 1.0, bend: 2.5, elongation: 1.2, rotation: 0, sBend: 0 },
      { x: 0.0, y: 0.0, color: parseHSL("hsla(343, 100%, 76%, 1)"), intensity: 1.1, bend: 3.0, elongation: 1.4, rotation: 0, sBend: 0 }
    ]
  },
  {
    name: "Ocean Dreams",
    points: [
      { x: 0.96, y: 0.96, color: parseHSL("hsla(55, 93%, 54%, 1)"), intensity: 0.85, bend: 2.5, elongation: 1.2, rotation: 0, sBend: 0 },
      { x: 0.05, y: 0.90, color: parseHSL("hsla(229, 71%, 68%, 1)"), intensity: 1.0, bend: 3.0, elongation: 1.4, rotation: 0, sBend: 0 },
      { x: 0.57, y: 0.73, color: parseHSL("hsla(308, 93%, 51%, 1)"), intensity: 1.1, bend: 2.8, elongation: 1.3, rotation: 0, sBend: 0 },
      { x: 0.20, y: 0.04, color: parseHSL("hsla(318, 60%, 76%, 1)"), intensity: 0.9, bend: 2.2, elongation: 1.5, rotation: 0, sBend: 0 },
      { x: 0.74, y: 0.15, color: parseHSL("hsla(324, 92%, 59%, 1)"), intensity: 1.2, bend: 3.2, elongation: 1.6, rotation: 0, sBend: 0 }
    ]
  },
  {
    name: "Sage Harmony",
    points: [
      { x: 0.96, y: 0.34, color: parseHSL("hsla(152, 15%, 64%, 1)"), intensity: 1.0, bend: 3.5, elongation: 3.16, rotation: 0, sBend: 0 },
      { x: 0.98, y: 0.95, color: parseHSL("hsla(58, 46%, 67%, 1)"), intensity: 0.8, bend: 2.8, elongation: 1.44, rotation: 0, sBend: 0 },
      { x: 0.11, y: 0.55, color: parseHSL("hsla(208, 100%, 93%, 1)"), intensity: 0.85, bend: 2.9, elongation: 1.51, rotation: 0, sBend: 0 },
      { x: 0.38, y: 0.84, color: parseHSL("hsla(62, 77%, 74%, 1)"), intensity: 0.75, bend: 2.7, elongation: 1.30, rotation: 0, sBend: 0 },
      { x: 0.20, y: 0.0, color: parseHSL("hsla(237, 77%, 74%, 1)"), intensity: 0.35, bend: 2.0, elongation: 0.38, rotation: 0, sBend: 0 },
      { x: 0.40, y: 0.0, color: parseHSL("hsla(187, 77%, 74%, 1)"), intensity: 0.35, bend: 2.0, elongation: 0.38, rotation: 0, sBend: 0 },
      { x: 1.0, y: 0.0, color: parseHSL("hsla(209, 77%, 74%, 1)"), intensity: 0.35, bend: 2.0, elongation: 0.38, rotation: 0, sBend: 0 }
    ]
  },
  {
    name: "Red Radiance",
    points: [
      { x: 0.4, y: 0.2, color: parseHSL("hsla(28, 100%, 74%, 1)"), intensity: 1.0, bend: 2.5, elongation: 0.5, rotation: 0, sBend: 0 },
      { x: 0.8, y: 0.0, color: parseHSL("hsla(189, 100%, 56%, 1)"), intensity: 1.0, bend: 2.5, elongation: 0.5, rotation: 0, sBend: 0 },
      { x: 0.0, y: 0.5, color: parseHSL("hsla(355, 100%, 93%, 1)"), intensity: 1.0, bend: 2.5, elongation: 0.5, rotation: 0, sBend: 0 },
      { x: 0.8, y: 0.5, color: parseHSL("hsla(340, 100%, 76%, 1)"), intensity: 1.0, bend: 2.5, elongation: 0.5, rotation: 0, sBend: 0 },
      { x: 0.0, y: 1.0, color: parseHSL("hsla(22, 100%, 77%, 1)"), intensity: 1.0, bend: 2.5, elongation: 0.5, rotation: 0, sBend: 0 },
      { x: 0.8, y: 1.0, color: parseHSL("hsla(242, 100%, 70%, 1)"), intensity: 1.2, bend: 3.0, elongation: 1.21, rotation: 0, sBend: 0 },
      { x: 0.0, y: 0.0, color: parseHSL("hsla(343, 100%, 76%, 1)"), intensity: 1.0, bend: 2.5, elongation: 0.5, rotation: 0, sBend: 0 }
    ]
  },
  {
    name: "Orange Glow",
    points: [
      { 
        x: 0.8, 
        y: 0.2, 
        color: hslToHex(18, 100, 50), 
        intensity: 1.0, 
        bend: 2.5, 
        elongation: 2.0,
        rotation: 0,
        sBend: 0 
      },
      { 
        x: 0.22, 
        y: 0.8, 
        color: parseHSL("hsla(304, 100%, 65%, 1)"), 
        intensity: 1.0, 
        bend: 2.5, 
        elongation: 2.0,
        rotation: 0,
        sBend: 0 
      },
      { 
        x: 0.47, 
        y: 0.08, 
        color: hslToHex(0, 100, 65), 
        intensity: 0.1, 
        bend: 2.0, 
        elongation: 0.2,
        rotation: 0,
        sBend: 0 
      }
    ]
  },
  {
    name: "Neon Blend",
    points: [
      { 
        x: 0.8, 
        y: 0.88, 
        color: parseHSL("hsla(64, 100%, 65%, 1)"), 
        intensity: 1.2, 
        bend: 2.5, 
        elongation: 1.3,
        rotation: 0,
        sBend: 0 
      },
      { 
        x: 0.8, 
        y: 0.2, 
        color: parseHSL("hsla(304, 100%, 65%, 1)"), 
        intensity: 1.1, 
        bend: 2.8, 
        elongation: 1.4,
        rotation: 0,
        sBend: 0 
      },
      { 
        x: 0.5, 
        y: 0.8, 
        color: parseHSL("hsla(184, 100%, 65%, 1)"), 
        intensity: 1.0, 
        bend: 2.5, 
        elongation: 1.2,
        rotation: 0,
        sBend: 0 
      }
    ]
  }
]; 