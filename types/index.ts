export interface Point {
  x: number
  y: number
}

export interface BaseColor {
  hue: number
  saturation: number
  lightness: number
  name: string
  curvePoints: Point[]
} 