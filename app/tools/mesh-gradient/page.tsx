'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Settings, Move } from 'lucide-react';
import { vertexShaderSource, fragmentShaderSource } from './shaders';
import './styles.scss';

export default function MeshGradientEditor() {
  const [points, setPoints] = useState([
    { x: 0.25, y: 0.25, color: '#ff0000', intensity: 1.0, bend: 3.0, elongation: 1.0 },
    { x: 0.75, y: 0.75, color: '#0000ff', intensity: 1.0, bend: 3.0, elongation: 1.0 }
  ]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(0);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const initWebGL = () => {
    if (!canvasRef.current) return;
    
    // Get WebGL context with alpha and preserveDrawingBuffer
    const gl = canvasRef.current.getContext('webgl', { 
      alpha: true,
      preserveDrawingBuffer: true,
      antialias: true
    });
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    
    glRef.current = gl;

    // Create and compile vertex shader
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertShader) return;
    gl.shaderSource(vertShader, vertexShaderSource);
    gl.compileShader(vertShader);

    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertShader));
      return;
    }

    // Create and compile fragment shader
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragShader) return;
    gl.shaderSource(fragShader, fragmentShaderSource);
    gl.compileShader(fragShader);

    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragShader));
      return;
    }

    // Create and link program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;

    // Set up geometry
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Get and enable position attribute
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const drawGradient = () => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program || !canvasRef.current) return;

    // Set viewport and clear
    gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use program
    gl.useProgram(program);

    // Set uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const pointsLocation = gl.getUniformLocation(program, 'points');
    const intensitiesLocation = gl.getUniformLocation(program, 'intensities');
    const bendFactorsLocation = gl.getUniformLocation(program, 'bendFactors');
    const elongationsLocation = gl.getUniformLocation(program, 'elongations');
    const numPointsLocation = gl.getUniformLocation(program, 'numPoints');

    // Set resolution
    gl.uniform2f(resolutionLocation, canvasRef.current.width, canvasRef.current.height);

    // Prepare point data
    const pointsData = new Float32Array(128); // 32 points * 4 components
    points.forEach((point, i) => {
      const baseIndex = i * 4;
      pointsData[baseIndex] = point.x;     // x position
      pointsData[baseIndex + 1] = point.y; // y position
      
      // Convert hex color to RGB
      const r = parseInt(point.color.slice(1, 3), 16) / 255;
      const g = parseInt(point.color.slice(3, 5), 16) / 255;
      const b = parseInt(point.color.slice(5, 7), 16) / 255;
      
      pointsData[baseIndex + 2] = r;
      pointsData[baseIndex + 3] = g;
      if (i < points.length - 1) {
        pointsData[baseIndex + 4] = b; // Store blue in the next point's x
      } else {
        pointsData[baseIndex + 2] = b; // For the last point, store blue with r,g
      }
    });

    const intensitiesData = new Float32Array(points.map(p => p.intensity));
    const bendFactorsData = new Float32Array(points.map(p => p.bend));
    const elongationsData = new Float32Array(points.map(p => p.elongation));

    // Set uniforms
    gl.uniform4fv(pointsLocation, pointsData);
    gl.uniform1fv(intensitiesLocation, intensitiesData);
    gl.uniform1fv(bendFactorsLocation, bendFactorsData);
    gl.uniform1fv(elongationsLocation, elongationsData);
    gl.uniform1i(numPointsLocation, points.length);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const drawControlPoints = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each control point
    points.forEach((point, index) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      
      // Draw origin point indicator (crosshair)
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Outer circle (white background)
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.stroke();
      
      // Inner circle (point color)
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = point.color;
      ctx.fill();
      
      // Highlight for selected/hovered point
      if (index === selectedPoint || index === hoverPoint) {
        // Outer highlight ring
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Inner highlight ring
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw point index
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${index + 1}`, x, y);
    });

    // Draw cursor indicator when not over a point and not dragging
    if (hoverPoint === null && !isDragging) {
      const x = lastMousePos.x * canvas.width;
      const y = lastMousePos.y * canvas.height;
      
      // Crosshair
      ctx.beginPath();
      ctx.moveTo(x - 12, y);
      ctx.lineTo(x + 12, y);
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x, y + 12);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Potential new point indicator
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  // Initialize WebGL when component mounts
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      // Set canvas size to match display size
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      initWebGL();
      drawGradient();
      drawControlPoints();
    }
  }, []);

  // Redraw when points change
  useEffect(() => {
    drawGradient();
  }, [points]);

  // Add resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        drawGradient();
        drawControlPoints();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Select first point by default when component mounts
    setSelectedPoint(0);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (hoverPoint !== null) {
      setSelectedPoint(hoverPoint);
    } else if (!isDragging && points.length < 32) {
      const newPoint = {
        x,
        y,
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
        intensity: 1.0,
        bend: 3.0,
        elongation: 1.0
      };
      setPoints([...points, newPoint]);
      setSelectedPoint(points.length);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Get precise cursor position relative to canvas
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setLastMousePos({ x, y });

    // More precise hit detection
    const hoveredIndex = points.findIndex(point => {
      const dx = point.x - x;
      const dy = point.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 0.02;
    });
    
    setHoverPoint(hoveredIndex === -1 ? null : hoveredIndex);

    // Update point position to exact cursor location
    if (isDragging && selectedPoint !== null) {
      const newPoints = [...points];
      newPoints[selectedPoint] = {
        ...newPoints[selectedPoint],
        x,
        y
      };
      setPoints(newPoints);
      drawControlPoints();
    }
  };

  return (
    <div className="mesh-gradient">
      <div className="mesh-gradient-sidebar">
        <h3 className="mesh-gradient-sidebar-header">
          <Settings className="w-5 h-5" />
          Controls
        </h3>
        
        <div className="mesh-gradient-sidebar-controls">
          <div className="mesh-gradient-sidebar-button-group">
            <button
              className="add"
              onClick={() => {
                if (points.length < 32) {
                  const newPoint = {
                    x: 0.5,
                    y: 0.5,
                    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
                    intensity: 1.0,
                    bend: 3.0,
                    elongation: 1.0
                  };
                  setPoints([...points, newPoint]);
                  setSelectedPoint(points.length);
                }
              }}
              disabled={points.length >= 32}
            >
              <Plus className="w-4 h-4" /> Add Point
            </button>
            <button
              className="remove"
              onClick={() => {
                if (selectedPoint !== null && points.length > 2) {
                  setPoints(points.filter((_, index) => index !== selectedPoint));
                  setSelectedPoint(0);
                }
              }}
              disabled={points.length <= 2}
            >
              <Minus className="w-4 h-4" /> Remove
            </button>
          </div>

          <div className="mesh-gradient-sidebar-point-list">
            <h4 className="mesh-gradient-sidebar-point-list-header">
              Points ({points.length}/32)
            </h4>
            <div className="mesh-gradient-sidebar-point-list-container">
              {points.map((point, index) => (
                <div
                  key={index}
                  className={`mesh-gradient-sidebar-point-list-item ${
                    selectedPoint === index ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedPoint(index)}
                >
                  <div
                    className="color-preview"
                    style={{ backgroundColor: point.color }}
                  />
                  <span className="point-label">Point {index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedPoint !== null && (
            <div className="mesh-gradient-sidebar-point-controls">
              <div className="control-group">
                <label>Color</label>
                <input
                  type="color"
                  value={points[selectedPoint].color}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[selectedPoint] = {
                      ...newPoints[selectedPoint],
                      color: e.target.value
                    };
                    setPoints(newPoints);
                  }}
                />
              </div>

              <div className="control-group">
                <label>X Position: {(points[selectedPoint].x * 100).toFixed(1)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={points[selectedPoint].x}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[selectedPoint] = {
                      ...newPoints[selectedPoint],
                      x: parseFloat(e.target.value)
                    };
                    setPoints(newPoints);
                  }}
                />
              </div>

              <div className="control-group">
                <label>Y Position: {(points[selectedPoint].y * 100).toFixed(1)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={points[selectedPoint].y}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[selectedPoint] = {
                      ...newPoints[selectedPoint],
                      y: parseFloat(e.target.value)
                    };
                    setPoints(newPoints);
                  }}
                />
              </div>

              <div className="control-group">
                <label>Intensity: {points[selectedPoint].intensity.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={points[selectedPoint].intensity}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[selectedPoint] = {
                      ...newPoints[selectedPoint],
                      intensity: parseFloat(e.target.value)
                    };
                    setPoints(newPoints);
                  }}
                />
              </div>

              <div className="control-group">
                <label>Bend Factor: {points[selectedPoint].bend.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="6.0"
                  step="0.1"
                  value={points[selectedPoint].bend}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[selectedPoint] = {
                      ...newPoints[selectedPoint],
                      bend: parseFloat(e.target.value)
                    };
                    setPoints(newPoints);
                  }}
                />
              </div>

              <div className="control-group">
                <label>Elongation: {points[selectedPoint].elongation.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.1"
                  value={points[selectedPoint].elongation}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[selectedPoint] = {
                      ...newPoints[selectedPoint],
                      elongation: parseFloat(e.target.value)
                    };
                    setPoints(newPoints);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mesh-gradient-canvas-area">
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        />
        <div className="help-text">
          <Move className="w-4 h-4" />
          Click to add points (max 32). Drag to move. Adjust controls in sidebar.
        </div>
      </div>
    </div>
  );
} 