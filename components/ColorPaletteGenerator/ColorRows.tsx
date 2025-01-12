import React from 'react';
import { BaseColor, Point } from './types';
import styles from './ColorPaletteGenerator.module.css';

interface ColorRowsProps {
  baseColors: BaseColor[];
}

export function ColorRows({ baseColors }: ColorRowsProps) {
  const interpolateCurve = (t: number, points: Point[]) => {
    const [p0, p1, p2, p3] = points;
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    
    const y = uuu * p0.y + 
              3 * uu * t * p1.y + 
              3 * u * tt * p2.y + 
              ttt * p3.y;
    
    return (150 - y) / 150;
  };

  const generateRowStops = (baseColor: BaseColor) => {
    const stops = [];
    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const intensity = interpolateCurve(t, baseColor.curvePoints);
      const lightness = intensity * 100;
      stops.push(`hsl(${baseColor.hue}, ${baseColor.saturation}%, ${lightness}%)`);
    }
    return stops;
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
  };

  return (
    <div className={styles.colorRows}>
      {baseColors.map((baseColor, rowIndex) => (
        <div key={rowIndex} className={styles.colorRow}>
          {generateRowStops(baseColor).map((color, stopIndex) => (
            <div
              key={stopIndex}
              className={styles.colorStop}
              style={{ backgroundColor: color }}
              onClick={() => copyToClipboard(color)}
            >
              <div className={styles.colorStopLabel}>
                {color}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
} 