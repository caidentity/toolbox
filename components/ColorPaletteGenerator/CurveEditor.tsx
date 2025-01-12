import React, { useRef, useState, useCallback } from 'react';
import { Point } from './types';
import styles from './CurveEditor.module.css';

interface CurveEditorProps {
  points: Point[];
  onChange: (points: Point[]) => void;
  width?: number;
  height?: number;
}

export function CurveEditor({ 
  points, 
  onChange, 
  width = 200, 
  height = 150 
}: CurveEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const getMousePosition = useCallback((event: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    
    const mouseX = (event.clientX - CTM.e) / CTM.a;
    const mouseY = (event.clientY - CTM.f) / CTM.d;
    return { x: mouseX, y: mouseY };
  }, []);

  const startDragging = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    setDraggingIndex(index);
  };

  const stopDragging = () => {
    setDraggingIndex(null);
  };

  const drag = useCallback((event: React.MouseEvent) => {
    if (draggingIndex === null || draggingIndex === 0 || draggingIndex === points.length - 1) return;
    
    const coords = getMousePosition(event);
    const x = Math.max(0, Math.min(width, coords.x));
    const y = Math.max(0, Math.min(height, coords.y));
    
    const newPoints = [...points];
    newPoints[draggingIndex] = { x, y };
    onChange(newPoints);
  }, [draggingIndex, points, onChange, getMousePosition, width, height]);

  const createPath = (points: Point[]) => {
    return `M ${points[0].x},${points[0].y} 
            C ${points[1].x},${points[1].y} 
              ${points[2].x},${points[2].y}
              ${points[3].x},${points[3].y}`;
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={styles.curveEditor}
      onMouseMove={drag}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
    >
      <path
        d={createPath(points)}
        className={styles.curvePath}
      />
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={4}
          className={`${styles.point} ${
            index === 0 || index === points.length - 1 
              ? styles.fixedPoint 
              : styles.controlPoint
          }`}
          onMouseDown={(e) => startDragging(index, e)}
          style={{ 
            cursor: index === 0 || index === points.length - 1 
              ? "not-allowed" 
              : "grab" 
          }}
        />
      ))}
    </svg>
  );
} 