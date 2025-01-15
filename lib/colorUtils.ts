import type { Point, BaseColor } from '@/types'

export const interpolateCurve = (t: number, points: Point[]): number => {
  const [p0, p1, p2, p3] = points
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t
  
  return (150 - (uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y)) / 150
}

export const generateRowStops = (baseColor: BaseColor): string[] => {
  const stops: string[] = []
  for (let i = 0; i < 11; i++) {
    const t = i / 10
    const intensity = interpolateCurve(t, baseColor.curvePoints)
    const lightness = intensity * 100
    stops.push(`hsl(${baseColor.hue}, ${baseColor.saturation}%, ${lightness}%)`)
  }
  return stops
} 