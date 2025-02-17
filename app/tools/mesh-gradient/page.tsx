'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Settings, Move, Download } from 'lucide-react';
import { vertexShaderSource, fragmentShaderSource } from './shaders';
import './styles.scss';
import Button from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { generateCSSGradient, generateSVG } from './export-utils';
import { CustomSlider } from '@/components/ui/Slider';
import { cn } from '@/lib/utils';
import { gradientPresets } from './gradient-presets';

type MenuType = 'export';

interface SettingControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  onReset?: () => void;
}

function SettingControl({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  unit = '', 
  onChange, 
  onReset 
}: SettingControlProps) {
  return (
    <div className="control-group">
      <div className="control-header">
        <label>{label}</label>
        <div className="value-controls">
          {onReset && (
            <Button
              size="xs"
              variant="ghost"
              onClick={onReset}
            >
              Reset
            </Button>
          )}
          <span className="value-display">
            {value}{unit}
          </span>
        </div>
      </div>
      <CustomSlider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onChange={([newValue]) => onChange(newValue)}
      />
    </div>
  );
}

interface SettingsCardProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

function SettingsCard({ 
  title, 
  defaultOpen = true, 
  children,
  className 
}: SettingsCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn('settings-card', className)}>
      <div
        className="settings-card-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2>{title}</h2>
        <svg 
          className={cn(
            'settings-card-chevron',
            isOpen && 'rotate'
          )}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div
        className={cn(
          'settings-card-content',
          isOpen ? 'settings-card-open' : 'settings-card-closed'
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default function MeshGradientEditor() {
  const [points, setPoints] = useState([
    { x: 0.2, y: 0.2, color: '#FF4D4D', intensity: 1.0, bend: 3.0, elongation: 1.0 },
    { x: 0.8, y: 0.2, color: '#4D4DFF', intensity: 1.0, bend: 3.0, elongation: 1.0 },
    { x: 0.5, y: 0.8, color: '#4DFF4D', intensity: 1.0, bend: 3.0, elongation: 1.0 }
  ]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(0);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [openMenus, setOpenMenus] = useState<{
    type: MenuType;
    anchor: { x: number; y: number };
  } | null>(null);

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
      
      // Convert hex color to RGB with proper scaling
      const r = parseInt(point.color.slice(1, 3), 16) / 255;
      const g = parseInt(point.color.slice(3, 5), 16) / 255;
      const b = parseInt(point.color.slice(5, 7), 16) / 255;
      
      // Store RGB values more accurately
      pointsData[baseIndex + 2] = r;
      pointsData[baseIndex + 3] = g;
      
      // Handle blue component storage
      if (i < points.length - 1) {
        pointsData[baseIndex + 4] = b; // Store blue in the next point's x
      } else {
        // For the last point, store blue with r,g
        pointsData[baseIndex + 2] = b;
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

  const handleMenuOpen = (type: MenuType) => (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setOpenMenus({
      type,
      anchor: {
        x: rect.left,
        y: rect.bottom
      }
    });
  };

  const handleMenuClose = () => {
    setOpenMenus(null);
  };

  const handleExportFormat = (format: 'css' | 'svg') => {
    let content = '';
    
    switch (format) {
      case 'css':
        content = generateCSSGradient(points);
        // Copy CSS to clipboard
        navigator.clipboard.writeText(content).then(() => {
          handleMenuClose();
          // Show toast notification
          const el = document.createElement('div');
          el.style.position = 'fixed';
          el.style.top = '1rem';
          el.style.left = '50%';
          el.style.transform = 'translateX(-50%)';
          el.style.background = 'rgba(0, 0, 0, 0.8)';
          el.style.color = 'white';
          el.style.padding = '0.5rem 1rem';
          el.style.borderRadius = '4px';
          el.style.fontSize = '0.875rem';
          el.textContent = 'CSS copied to clipboard!';
          document.body.appendChild(el);
          setTimeout(() => el.remove(), 2000);
        });
        break;

      case 'svg':
        content = generateSVG(points);
        
        // Create blob and download link
        const blob = new Blob([content], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mesh-gradient.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        handleMenuClose();
        // Show toast notification
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.top = '1rem';
        el.style.left = '50%';
        el.style.transform = 'translateX(-50%)';
        el.style.background = 'rgba(0, 0, 0, 0.8)';
        el.style.color = 'white';
        el.style.padding = '0.5rem 1rem';
        el.style.borderRadius = '4px';
        el.style.fontSize = '0.875rem';
        el.textContent = 'SVG downloaded!';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
        break;
    }
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newPoints = [...points];
    newPoints[index] = {
      ...newPoints[index],
      color: newColor.toUpperCase() // Normalize color format
    };
    setPoints(newPoints);
  };

  const handleRandomPreset = () => {
    const randomIndex = Math.floor(Math.random() * gradientPresets.length);
    const preset = gradientPresets[randomIndex];
    setPoints([...preset.points]);
    setSelectedPoint(0);
  };

  return (
    <div className="mesh-gradient">
      <div className="mesh-gradient-sidebar">
        <h2>Mesh Gradient</h2>
        
        <div className="mesh-gradient-sidebar-controls">
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon="content_copy_24"
                rightIcon="chevron_down_24"
                onClick={handleMenuOpen('export')}
              >
                Export
              </Button>
              <Menu
                isOpen={openMenus?.type === 'export'}
                onClose={handleMenuClose}
                anchorPoint={openMenus?.type === 'export' ? openMenus.anchor : undefined}
                items={[
                  {
                    type: 'default',
                    label: 'Copy as CSS',
                    onClick: () => handleExportFormat('css'),
                    leftIcon: 'content_copy_24'
                  },
                  {
                    type: 'default',
                    label: 'Download SVG',
                    onClick: () => handleExportFormat('svg'),
                    leftIcon: 'download_24'
                  }
                ]}
              />
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              leftIcon="shuffle_24"
              onClick={handleRandomPreset}
            >
              Random Preset
            </Button>
          </div>

          <SettingsCard title="Points">
            <div className="mesh-gradient-point-grid">
              {points.map((point, index) => (
                <div
                  key={index}
                  className={`point-card ${selectedPoint === index ? 'selected' : ''}`}
                  onClick={() => setSelectedPoint(index)}
                >
                  <div className="point-preview" style={{ backgroundColor: point.color }} />
                  <div className="point-info">
                    <span className="point-name">Point {index + 1}</span>
                    {selectedPoint === index && points.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="remove-point"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPoints(points.filter((_, i) => i !== index));
                          setSelectedPoint(0);
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {points.length < 32 && (
                <button
                  className="add-point-card"
                  onClick={() => {
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
                  }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Point</span>
                </button>
              )}
            </div>
          </SettingsCard>

          {selectedPoint !== null && (
            <SettingsCard title={`Point ${selectedPoint + 1} Settings`}>
              <div className="control-group">
                <label>Color</label>
                <input
                  type="color"
                  value={points[selectedPoint].color}
                  onChange={(e) => handleColorChange(selectedPoint, e.target.value)}
                />
              </div>

              <SettingControl
                label="X Position"
                value={points[selectedPoint].x * 100}
                min={0}
                max={100}
                step={0.1}
                unit="%"
                onChange={(value) => {
                  const newPoints = [...points];
                  newPoints[selectedPoint] = {
                    ...newPoints[selectedPoint],
                    x: value / 100
                  };
                  setPoints(newPoints);
                }}
              />

              <SettingControl
                label="Y Position"
                value={points[selectedPoint].y * 100}
                min={0}
                max={100}
                step={0.1}
                unit="%"
                onChange={(value) => {
                  const newPoints = [...points];
                  newPoints[selectedPoint] = {
                    ...newPoints[selectedPoint],
                    y: value / 100
                  };
                  setPoints(newPoints);
                }}
              />

              <SettingControl
                label="Intensity"
                value={points[selectedPoint].intensity}
                min={0.1}
                max={3.0}
                step={0.1}
                onChange={(value) => {
                  const newPoints = [...points];
                  newPoints[selectedPoint] = {
                    ...newPoints[selectedPoint],
                    intensity: value
                  };
                  setPoints(newPoints);
                }}
              />

              <SettingControl
                label="Bend Factor"
                value={points[selectedPoint].bend}
                min={0.1}
                max={12.0}
                step={0.1}
                onChange={(value) => {
                  const newPoints = [...points];
                  newPoints[selectedPoint] = {
                    ...newPoints[selectedPoint],
                    bend: value
                  };
                  setPoints(newPoints);
                }}
              />

              <SettingControl
                label="Elongation"
                value={points[selectedPoint].elongation}
                min={0.1}
                max={4.0}
                step={0.1}
                onChange={(value) => {
                  const newPoints = [...points];
                  newPoints[selectedPoint] = {
                    ...newPoints[selectedPoint],
                    elongation: value
                  };
                  setPoints(newPoints);
                }}
              />
            </SettingsCard>
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