import { ColorBand, Point } from '../types'

interface ParsedColorStep {
  step: number
  hex: string
}

interface ParsedColorGroup {
  name: string
  steps: ParsedColorStep[]
}

interface HSLColor {
  h: number
  s: number
  l: number
}

// Default curve points for new color bands
const DEFAULT_CURVE_POINTS: Point[] = [
  { x: 0, y: 150 },   // Darkest
  { x: 66, y: 100 },
  { x: 133, y: 50 },
  { x: 200, y: 0 }    // Lightest
]

export const hexToHSL = (hex: string): HSLColor => {
  // Remove the # if present
  hex = hex.replace('#', '')
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    
    h *= 60
  }
  
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

const normalizeColorName = (name: string): string => {
  return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const parseScssVariables = (input: string): ParsedColorGroup[] => {
  // Split input into lines and clean up
  const lines = input.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))

  const colorGroups: Record<string, ParsedColorGroup> = {}

  lines.forEach(line => {
    // Match SCSS color variable pattern
    const match = line.match(/\$colors-([a-zA-Z-]+)-(\d+):\s*(#[A-Fa-f0-9]{6});?/)
    if (!match) return

    const [, colorName, step, hex] = match
    const normalizedName = normalizeColorName(colorName)

    if (!colorGroups[colorName]) {
      colorGroups[colorName] = {
        name: normalizedName,
        steps: []
      }
    }

    colorGroups[colorName].steps.push({
      step: parseInt(step),
      hex
    })
  })

  return Object.values(colorGroups)
}

const createColorBand = (colorGroup: ParsedColorGroup): ColorBand => {
  // Sort steps to ensure we get the middle color correctly
  const sortedSteps = [...colorGroup.steps].sort((a, b) => a.step - b.step)
  
  // Use the middle step (around 500) for base HSL values
  const middleStep = sortedSteps.find(s => s.step === 500) || 
    sortedSteps[Math.floor(sortedSteps.length / 2)]
  
  const hsl = hexToHSL(middleStep.hex)

  return {
    id: Math.random(),
    name: colorGroup.name,
    hue: hsl.h,
    saturation: hsl.s,
    lightness: 50, // Use 50 as default and let curve handle variations
    steps: sortedSteps.length,
    curvePoints: [...DEFAULT_CURVE_POINTS]
  }
}

export const importColorBands = (input: string): ColorBand[] => {
  const colorGroups = parseScssVariables(input)
  if (colorGroups.length === 0) {
    throw new Error('No valid color definitions found')
  }
  return colorGroups.map(createColorBand)
} 