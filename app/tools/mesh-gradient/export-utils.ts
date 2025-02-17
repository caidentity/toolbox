interface GradientPoint {
  x: number;
  y: number;
  color: string;
  intensity: number;
  bend: number;
  elongation: number;
}

// Helper to convert hex to RGB
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

export function generateCSSGradient(points: GradientPoint[]) {
  // Sort points by their position to create a more natural gradient
  const sortedPoints = [...points].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 0.2) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  const stops = sortedPoints.map((point) => {
    const angle = (Math.atan2(point.y - 0.5, point.x - 0.5) * 180 / Math.PI + 360) % 360;
    return `${point.color} ${angle}deg`;
  }).join(', ');

  return `background: conic-gradient(from 90deg at 50% 50%, ${stops});
  filter: blur(${Math.max(...points.map(p => p.intensity * 30))}px);`;
}

export function generateSVG(points: GradientPoint[]) {
  const size = 1200;
  
  // Generate gradient definitions matching shader logic
  const gradientDefs = points.map((point, index) => {
    const rgb = hexToRGB(point.color);
    
    // Create gradient stops matching shader distance calculation
    const stops = [];
    const numStops = 32;
    
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      // Match shader's distance and weight calculations
      const weight = 1.0 / (Math.pow(t * 2.0 + 0.1, point.bend));
      const opacity = weight * point.intensity;
      
      stops.push(`
        <stop 
          offset="${t * 100}%" 
          style="stop-color:${rgbToString(rgb.r, rgb.g, rgb.b)};
          stop-opacity:${opacity}"
        />`);
    }

    return `
      <radialGradient 
        id="grad${index}" 
        cx="${point.x * size}" 
        cy="${point.y * size}" 
        r="${size * point.elongation}"
        gradientUnits="userSpaceOnUse">
        ${stops.join('\n')}
      </radialGradient>`;
  }).join('\n');

  // Create SVG matching shader's color blending
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      ${gradientDefs}
      <filter id="softlight">
        <feBlend mode="soft-light" in="SourceGraphic"/>
      </filter>
    </defs>
    
    <rect width="${size}" height="${size}" fill="white"/>
    
    <g style="mix-blend-mode: multiply">
      ${points.map((point, index) => `
        <circle 
          cx="${point.x * size}" 
          cy="${point.y * size}" 
          r="${size * point.elongation}"
          fill="url(#grad${index})"
        />`).join('\n')}
    </g>
  </svg>`;
} 