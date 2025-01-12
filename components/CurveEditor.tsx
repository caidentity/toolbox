'use client'

import { useCallback, useRef, useState } from 'react'
import type { Point } from '../types'

interface Props {
  points: Point[]
  onChange: (points: Point[]) => void
  width?: number
  height?: number
}

export function CurveEditor({ 
  points, 
  onChange, 
  width = 200, 
  height = 150 
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  const getMousePosition = useCallback((event: React.MouseEvent) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    
    const CTM = svg.getScreenCTM()
    if (!CTM) return { x: 0, y: 0 }

    return {
      x: (event.clientX - CTM.e) / CTM.a,
      y: (event.clientY - CTM.f) / CTM.d
    }
  }, [])

  const createPath = (points: Point[]) => {
    return `M ${points[0].x},${points[0].y} 
            C ${points[1].x},${points[1].y} 
              ${points[2].x},${points[2].y}
              ${points[3].x},${points[3].y}`
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="bg-gray-100 rounded"
      onMouseMove={(e) => {
        if (draggingIndex === null || draggingIndex === 0 || draggingIndex === points.length - 1) return
        const coords = getMousePosition(e)
        const newPoints = [...points]
        newPoints[draggingIndex] = {
          x: Math.max(0, Math.min(width, coords.x)),
          y: Math.max(0, Math.min(height, coords.y))
        }
        onChange(newPoints)
      }}
      onMouseUp={() => setDraggingIndex(null)}
      onMouseLeave={() => setDraggingIndex(null)}
    >
      <path
        d={createPath(points)}
        fill="none"
        stroke="gray"
        strokeWidth="2"
      />
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={4}
          fill={index === 0 || index === points.length - 1 ? "red" : "blue"}
          onMouseDown={(e) => {
            e.preventDefault()
            setDraggingIndex(index)
          }}
          style={{ cursor: index === 0 || index === points.length - 1 ? "not-allowed" : "grab" }}
        />
      ))}
    </svg>
  )
} 