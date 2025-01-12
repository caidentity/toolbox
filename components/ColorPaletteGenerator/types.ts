export interface Point {
  x: number;
  y: number;
}

export interface BaseColor {
  hue: number;
  saturation: number;
  lightness: number;
  name: string;
  curvePoints: Point[];
}

export const defaultCurvePoints: Point[] = [
  { x: 0, y: 150 },    // Start point (fixed)
  { x: 50, y: 120 },   // Control point 1
  { x: 150, y: 30 },   // Control point 2
  { x: 200, y: 0 }     // End point (fixed)
]; 