'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Settings, Move, Download, Sliders, Shuffle, Undo2, Redo2 } from 'lucide-react';
import { vertexShaderSource, fragmentShaderSource } from './shaders';
import './styles.scss';
import Button from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { generateCSSGradient, generateSVG } from './export-utils';
import { CustomSlider } from '@/components/ui/Slider';
import { cn } from '@/lib/utils';
import { gradientPresets, hslToHex } from './gradient-presets';

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

function hexToHSL(hex: string): string {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB with higher precision
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Use more precise values without rounding
  return `hsla(${h * 360}, ${s * 100}%, ${l * 100}%, 1)`;
}

function rotateHue(hexColor: string, rotation: number): string {
  // Convert hex to HSL
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  // Convert RGB to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Apply rotation
  h = (h + rotation / 360) % 1;
  if (h < 0) h += 1;

  // Convert back to RGB
  function hue2rgb(p: number, q: number, t: number) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const newR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const newG = Math.round(hue2rgb(p, q, h) * 255);
  const newB = Math.round(hue2rgb(p, q, h - 1/3) * 255);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Add interface for GlobalControls props
interface GlobalControlsProps {
  noiseAmount: number;
  setNoiseAmount: (value: number) => void;
  hueRotation: number;
  setHueRotation: (value: number) => void;
  points: Array<{
    x: number;
    y: number;
    color: string;
    intensity: number;
    bend: number;
    elongation: number;
    rotation: number;
    sBend: number;
  }>;
  setPoints: (points: Array<{
    x: number;
    y: number;
    color: string;
    intensity: number;
    bend: number;
    elongation: number;
    rotation: number;
    sBend: number;
  }>) => void;
  onHueChange: (value: number) => void;
  onNoiseChange: (value: number) => void;
  drawGradient: () => void;
}

function GlobalControls({ 
  noiseAmount, 
  setNoiseAmount,
  hueRotation,
  setHueRotation,
  points,
  setPoints,
  onHueChange,
  onNoiseChange,
  drawGradient
}: GlobalControlsProps) {
  return (
    <SettingsCard title="Global Controls" defaultOpen={true}>
      <div className="control-group">
        <div className="control-header">
          <label>Noise</label>
          <div className="value-controls">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onNoiseChange(0)}
            >
              Remove
            </Button>
            <span className="value-display">
              {noiseAmount}%
            </span>
          </div>
        </div>
        <CustomSlider
          min={0}
          max={100}
          step={1}
          value={[noiseAmount]}
          onChange={([value]) => onNoiseChange(value)}
        />
      </div>

      <div className="control-group">
        <div className="control-header">
          <label>Hue Rotation</label>
          <Button
            size="xs"
            variant="ghost"
            leftIcon="shuffle_24"
            onClick={() => {
              const randomHue = Math.floor(Math.random() * 360);
              setHueRotation(randomHue);
              onHueChange(randomHue);
              drawGradient();
            }}
          >
            Randomize
          </Button>
        </div>
        <CustomSlider
          min={0}
          max={360}
          step={1}
          value={[hueRotation]}
          onChange={([value]) => {
            setHueRotation(value);
            onHueChange(value);
            drawGradient();
          }}
        />
      </div>
    </SettingsCard>
  );
}

export default function MeshGradientEditor() {
  const [points, setPoints] = useState([
    { 
      x: 0.2, 
      y: 0.2, 
      color: '#FF4D4D', 
      intensity: 1.0, 
      bend: 3.0, 
      elongation: 1.0,
      rotation: 0,
      sBend: 0 
    },
    { 
      x: 0.8, 
      y: 0.2, 
      color: '#4D4DFF', 
      intensity: 1.0, 
      bend: 3.0, 
      elongation: 1.0,
      rotation: 0,
      sBend: 0 
    },
    { 
      x: 0.5, 
      y: 0.8, 
      color: '#4DFF4D', 
      intensity: 1.0, 
      bend: 3.0, 
      elongation: 1.0,
      rotation: 0,
      sBend: 0 
    }
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
  const [noiseAmount, setNoiseAmount] = useState(0);
  const [hueRotation, setHueRotation] = useState(0);
  const [history, setHistory] = useState<Array<typeof points>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
    const noiseLocation = gl.getUniformLocation(program, 'noiseAmount');
    const rotationsLocation = gl.getUniformLocation(program, 'rotations');
    const sBendsLocation = gl.getUniformLocation(program, 'sBends');

    // Set resolution
    gl.uniform2f(resolutionLocation, canvasRef.current.width, canvasRef.current.height);

    // Prepare point data
    const pointsData = new Float32Array(128);
    points.forEach((point, i) => {
      const baseIndex = i * 4;
      pointsData[baseIndex] = point.x;
      pointsData[baseIndex + 1] = point.y;
      
      // More precise color conversion without rounding
      const hex = point.color.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      
      // Store without rounding for maximum precision
      pointsData[baseIndex + 2] = r;
      pointsData[baseIndex + 3] = g;
      
      if (i < points.length - 1) {
        pointsData[baseIndex + 4] = b;
      } else {
        pointsData[baseIndex + 2] = b;
      }
    });

    const intensitiesData = new Float32Array(points.map(p => p.intensity));
    const bendFactorsData = new Float32Array(points.map(p => p.bend));
    const elongationsData = new Float32Array(points.map(p => p.elongation));
    const rotationsData = new Float32Array(points.map(p => p.rotation));
    const sBendsData = new Float32Array(points.map(p => p.sBend));

    // Set uniforms
    gl.uniform4fv(pointsLocation, pointsData);
    gl.uniform1fv(intensitiesLocation, intensitiesData);
    gl.uniform1fv(bendFactorsLocation, bendFactorsData);
    gl.uniform1fv(elongationsLocation, elongationsData);
    gl.uniform1fv(rotationsLocation, rotationsData);
    gl.uniform1fv(sBendsLocation, sBendsData);
    gl.uniform1i(numPointsLocation, points.length);
    gl.uniform1f(noiseLocation, noiseAmount);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const drawControlPoints = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    points.forEach((point, index) => {
      const x = point.x * canvas.width;
      const y = (1 - point.y) * canvas.height;
      
      // Draw origin crosshair with drop shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 2;
      
      // Draw crosshair
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw center dot
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      ctx.restore();
      
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
      ctx.fillStyle = hexToHSL(point.color);
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
        
        // Draw origin crosshair on top for selected/hovered points
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
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

  // Initialize history with current points
  useEffect(() => {
    setHistory([points]);
    setHistoryIndex(0);
  }, []);

  const addToHistory = (newPoints: typeof points) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPoints);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    drawGradient(); // Ensure gradient updates after history change
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPoints(history[newIndex]);
      drawGradient(); // Update gradient after undo
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPoints(history[newIndex]);
      drawGradient(); // Update gradient after redo
    }
  };

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
    const y = 1.0 - ((e.clientY - rect.top) / rect.height);

    if (hoverPoint !== null) {
      setSelectedPoint(hoverPoint);
    } else if (!isDragging && points.length < 32) {
      const newPoint = {
        x,
        y,
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
        intensity: 1.0,
        bend: 3.0,
        elongation: 1.0,
        rotation: 0,
        sBend: 0
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
    
    // Calculate normalized coordinates (0-1)
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - ((e.clientY - rect.top) / rect.height);
    
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
      color: newColor.toUpperCase(), // Normalize color format
    };
    setPoints(newPoints);
    drawGradient(); // Ensure immediate update
  };

  const handleRandomPreset = () => {
    const randomIndex = Math.floor(Math.random() * gradientPresets.length);
    const preset = gradientPresets[randomIndex];
    setPoints([...preset.points]);
    setSelectedPoint(0);
  };

  // Add this effect to handle point changes
  useEffect(() => {
    if (history.length === 0) {
      setHistory([points]);
      setHistoryIndex(0);
    }
  }, [points]);

  // Add this effect to ensure gradient updates when points change
  useEffect(() => {
    drawGradient();
  }, [points]);

  return (
    <div className="mesh-gradient">
      <div className="mesh-gradient-sidebar">
        <h2>Mesh Gradient</h2>
        
        <div className="mesh-gradient-sidebar-controls">
          <div className="header-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="secondary"
                size="icon"
                disabled={historyIndex <= 0}
                onClick={undo}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled={historyIndex >= history.length - 1}
                onClick={redo}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>
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

          <GlobalControls 
            noiseAmount={noiseAmount}
            setNoiseAmount={(value) => {
              setNoiseAmount(value);
              drawGradient();
            }}
            hueRotation={hueRotation}
            setHueRotation={(value) => {
              setHueRotation(value);
              const newPoints = points.map(point => ({
                ...point,
                color: rotateHue(point.color, value)
              }));
              setPoints(newPoints);
              addToHistory(newPoints);
            }}
            points={points}
            setPoints={(value) => {
              setPoints(value);
              addToHistory(value);
            }}
            onHueChange={(value) => {
              const newPoints = points.map(point => ({
                ...point,
                color: rotateHue(point.color, value)
              }));
              setPoints(newPoints);
              addToHistory(newPoints);
            }}
            onNoiseChange={(value) => {
              setNoiseAmount(value);
              drawGradient();
            }}
            drawGradient={drawGradient}
          />

          <SettingsCard title="Points">
            <div className="mesh-gradient-point-grid">
              {points.map((point, index) => (
                <div
                  key={index}
                  className={`point-card ${selectedPoint === index ? 'selected' : ''}`}
                  onClick={() => setSelectedPoint(index)}
                >
                  <div 
                    className="point-preview" 
                    style={{ 
                      backgroundColor: hexToHSL(point.color)  // Convert hex to HSL for display
                    }} 
                  />
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
                      elongation: 1.0,
                      rotation: 0,
                      sBend: 0
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

              <SettingControl
                label="Rotation"
                value={points[selectedPoint].rotation}
                min={0}
                max={360}
                step={1}
                unit="°"
                onChange={(value) => {
                  const newPoints = [...points];
                  newPoints[selectedPoint] = {
                    ...newPoints[selectedPoint],
                    rotation: value * (Math.PI / 180) // Convert to radians for shader
                  };
                  setPoints(newPoints);
                }}
              />

              <SettingControl
                label="S-Bend"
                value={points[selectedPoint].sBend}
                min={-1}
                max={1}
                step={0.01}
                onChange={(value) => {
                  const newPoints = [...points];
                  newPoints[selectedPoint] = {
                    ...newPoints[selectedPoint],
                    sBend: value
                  };
                  setPoints(newPoints);
                }}
              />
            </SettingsCard>
          )}
        </div>
      </div>

      <div className="mesh-gradient-canvas-area">
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={800}
            height={800}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          />
          <div className="points-overlay">
            {points.map((point, index) => (
              <div
                key={index}
                className="point-origin"
                style={{
                  left: `${point.x * 100}%`,
                  top: `${(1 - point.y) * 100}%`,
                  opacity: index === selectedPoint ? 1 : 0.4,
                  zIndex: index === selectedPoint ? 2 : 1
                }}
              >
                <div className="origin-center" />
              </div>
            ))}
          </div>
          <div className="help-text">
            <Move className="w-4 h-4" />
            Click to add points (max 32). Drag to move. Adjust controls in sidebar.
          </div>
        </div>
      </div>
    </div>
  );
} 