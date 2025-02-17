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

// Helper to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

export function generateCSSGradient(points: GradientPoint[]) {
  // Sort points by intensity to layer them properly
  const sortedPoints = [...points].sort((a, b) => b.intensity - a.intensity);

  // Generate radial gradients for each point
  const gradients = sortedPoints.map((point) => {
    const hsl = hexToHSL(point.color);
    const x = Math.round(point.x * 100);
    const y = Math.round(point.y * 100);
    
    // Calculate radius based on intensity and elongation
    const radius = Math.round(100 * point.elongation * point.intensity);
    const opacity = Math.min(point.intensity, 1);

    // Create the gradient with standard CSS syntax
    return `radial-gradient(at ${x}% ${y}%, hsla(${hsl.h},${hsl.s}%,${hsl.l}%,${opacity}) 0px, transparent ${radius}%)`;
  }).join(',\n');

  // Get base color from most intense point
  const baseColor = hexToHSL(sortedPoints[0].color);

  // Format the final CSS
  return `background-color: hsla(${baseColor.h},${baseColor.s}%,${baseColor.l}%,1);
background-image: 
${gradients};
background-blend-mode: screen;`;
}

export function generateSVG(points: GradientPoint[]) {
  const size = 1200;
  const defs: string[] = [];
  const shapes: string[] = [];

  // Create main blend filter
  defs.push(`
    <filter id="mainBlend">
      <feGaussianBlur stdDeviation="35"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.2"/>
        <feFuncG type="linear" slope="1.2"/>
        <feFuncB type="linear" slope="1.2"/>
      </feComponentTransfer>
    </filter>
  `);

  // Sort points by intensity for proper layering
  const sortedPoints = [...points].sort((a, b) => a.intensity - b.intensity);

  // Generate gradients for each point
  sortedPoints.forEach((point, index) => {
    const gradientId = `gradient${index}`;
    
    // Create radial gradient with rotation and s-bend transforms
    const rotation = point.rotation * (180 / Math.PI); // Convert to degrees
    const transform = `rotate(${rotation})`;
    const sBendTransform = point.sBend !== 0 ? 
      `skewY(${point.sBend * 45})` : ''; // Convert s-bend to skew

    defs.push(`
      <radialGradient id="${gradientId}"
        cx="${point.x * 100}%"
        cy="${point.y * 100}%"
        r="${150 * point.elongation}%"
        fx="${point.x * 100}%"
        fy="${point.y * 100}%"
        gradientUnits="userSpaceOnUse"
        gradientTransform="${transform} ${sBendTransform}">
        <stop offset="0%" stop-color="${point.color}" stop-opacity="${point.intensity}"/>
        <stop offset="35%" stop-color="${point.color}" stop-opacity="${point.intensity * 0.8}"/>
        <stop offset="65%" stop-color="${point.color}" stop-opacity="${point.intensity * 0.3}"/>
        <stop offset="100%" stop-color="${point.color}" stop-opacity="0"/>
      </radialGradient>
    `);

    shapes.push(`
      <circle
        cx="${point.x * size}"
        cy="${point.y * size}"
        r="${size * 0.8 * point.elongation}"
        fill="url(#${gradientId})"
        style="mix-blend-mode: screen"
      />
    `);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    ${defs.join('\n')}
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g filter="url(#mainBlend)">
    ${shapes.join('\n')}
  </g>
</svg>`;
}

// Helper function (unchanged)
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
} 