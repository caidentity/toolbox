'use client'

import { useState } from 'react'
import { CurveEditor } from './CurveEditor'
import { BaseColor, Point } from '../types'
import { generateRowStops } from '../lib/colorUtils'

const defaultCurvePoints: Point[] = [
  { x: 0, y: 150 },    // Start point (fixed)
  { x: 50, y: 120 },   // Control point 1
  { x: 150, y: 30 },   // Control point 2
  { x: 200, y: 0 }     // End point (fixed)
]

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
]

export function ColorPaletteGenerator() {
  const [baseColors, setBaseColors] = useState<BaseColor[]>(initialColors)
  const [selectedColor, setSelectedColor] = useState(0)

  const addNewRow = () => {
    setBaseColors([...baseColors, { 
      hue: 0, 
      saturation: 100, 
      lightness: 50, 
      name: "New Color",
      curvePoints: [...defaultCurvePoints]
    }])
  }

  const removeRow = (index: number) => {
    setBaseColors(baseColors.filter((_, i) => i !== index))
    if (selectedColor >= index && selectedColor > 0) {
      setSelectedColor(selectedColor - 1)
    }
  }

  const updateBaseColor = (index: number, property: keyof BaseColor, value: any) => {
    const newColors = [...baseColors]
    newColors[index] = { ...newColors[index], [property]: value }
    setBaseColors(newColors)
  }

  const updateCurvePoints = (index: number, newPoints: Point[]) => {
    const newColors = [...baseColors]
    newColors[index] = { ...newColors[index], curvePoints: newPoints }
    setBaseColors(newColors)
  }

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
  }

  return (
    <div className="flex gap-4 p-4">
      {/* Add your JSX here */}
      <div>Color Palette Generator</div>
    </div>
  )
} 