'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Settings, Move } from 'lucide-react';
import { vertexShaderSource, fragmentShaderSource } from './shaders';
import './styles.scss';

export default function MeshGradientEditor() {
  const [points, setPoints] = useState([
    { x: 0.25, y: 0.25, color: '#ff0000', intensity: 1.0, bend: 1.0 },
    { x: 0.75, y: 0.75, color: '#0000ff', intensity: 1.0, bend: 1.0 }
  ]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);

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

    // Set uniforms
    gl.uniform4fv(pointsLocation, pointsData);
    gl.uniform1fv(intensitiesLocation, intensitiesData);
    gl.uniform1fv(bendFactorsLocation, bendFactorsData);
    gl.uniform1i(numPointsLocation, points.length);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // Initialize WebGL when component mounts
  useEffect(() => {
    if (canvasRef.current) {
      // Set canvas size to match display size
      const displayWidth = canvasRef.current.clientWidth;
      const displayHeight = canvasRef.current.clientHeight;
      canvasRef.current.width = displayWidth;
      canvasRef.current.height = displayHeight;
      
      initWebGL();
      drawGradient();
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
        const rect = canvasRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        drawGradient();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const clickedPointIndex = points.findIndex(point => {
      const dx = point.x - x;
      const dy = point.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 0.05;
    });

    if (clickedPointIndex !== -1) {
      setSelectedPoint(clickedPointIndex);
    } else if (!isDragging && points.length < 32) {
      const newPoint = {
        x,
        y,
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
        intensity: 1.0,
        bend: 1.0
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
    if (!canvasRef.current || !isDragging || selectedPoint === null) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newPoints = [...points];
    newPoints[selectedPoint] = { ...newPoints[selectedPoint], x, y };
    setPoints(newPoints);
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
                    bend: 1.0
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
                  setSelectedPoint(null);
                }
              }}
              disabled={selectedPoint === null || points.length <= 2}
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
                <label>
                  Intensity: {points[selectedPoint].intensity.toFixed(1)}
                </label>
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
                <label>
                  Bend Factor: {points[selectedPoint].bend.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
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