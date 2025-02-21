export interface Point {
  x: number
  y: number
}

export interface ColorBand {
  id: number
  hue: number
  saturation: number
  lightness: number
  steps: number
  curvePoints: Point[]
  name: string
  curveModified?: boolean
}

// Add type for step format
export type StepNameFormat = 'numeric' | 'padded' | 'hex' | 'alphabetic'

// Add type for menu type
export type MenuType = 'stepFormat' | 'export' 