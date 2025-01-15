'use client';

import { useState } from 'react';
import { CurveEditor } from './CurveEditor';
import type { BaseColor, Point } from '@/types';
import { generateRowStops } from '@/lib/colorUtils';

const defaultCurvePoints: Point[] = [
  { x: 0, y: 150 },    // Start point (fixed)
  { x: 50, y: 120 },   // Control point 1
  { x: 150, y: 30 },   // Control point 2
  { x: 200, y: 0 }     // End point (fixed)
];

const initialColors: BaseColor[] = [
  { 
    hue: 0, 
    saturation: 100, 
    lightness: 50, 
    name: "Red",
    curvePoints: [...defaultCurvePoints]
  },
  { 
    hue: 240, 
    saturation: 100, 
    lightness: 50, 
    name: "Blue",
    curvePoints: [...defaultCurvePoints]
  }
];

export function ColorPaletteGenerator() {
  console.log('Rendering ColorPaletteGenerator');
  const [baseColors, setBaseColors] = useState<BaseColor[]>(initialColors);
  const [selectedColor, setSelectedColor] = useState(0);

  const handleCurveChange = (points: Point[]) => {
    setBaseColors(colors => colors.map((color, index) => 
      index === selectedColor 
        ? { ...color, curvePoints: points }
        : color
    ));
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Color Palette Generator</h1>
      <div className="flex gap-4">
        <div className="flex flex-col gap-2">
          {baseColors.map((color, index) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(index)}
              className={`p-2 rounded ${
                index === selectedColor ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {color.name}
            </button>
          ))}
        </div>
        <CurveEditor 
          points={baseColors[selectedColor].curvePoints}
          onChange={handleCurveChange}
        />
      </div>
    </div>
  );
} 