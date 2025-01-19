'use client'

import { useState } from 'react'
import CurveEditor from './CurveEditor'
import './ColorPaletteGenerator.scss'

interface ColorBand {
  id: number
  hue: number
  saturation: number
  lightness: number
  steps: number
  curvePoints: Point[]
}

interface Point {
  x: number
  y: number
}

export default function ColorPaletteGenerator() {
  const [colorBands, setColorBands] = useState<ColorBand[]>([
    {
      id: 1,
      hue: 0,
      saturation: 100,
      lightness: 50,
      steps: 12,
      curvePoints: [
        { x: 0, y: 150 },
        { x: 66, y: 100 },
        { x: 133, y: 50 },
        { x: 200, y: 0 }
      ]
    },
    { id: 2, hue: 120, saturation: 100, lightness: 50, steps: 12, curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
    { id: 3, hue: 240, saturation: 100, lightness: 50, steps: 12, curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
    { id: 4, hue: 60, saturation: 100, lightness: 50, steps: 12, curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
    { id: 5, hue: 180, saturation: 100, lightness: 50, steps: 12, curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
  ])
  
  const [activeTab, setActiveTab] = useState(1)
  const [globalSteps, setGlobalSteps] = useState(12)

  // Add this utility function for cubic Bézier curve calculation
  const calculateBezierPoint = (t: number, p0: Point, p1: Point, p2: Point, p3: Point) => {
    const oneMinusT = 1 - t
    const oneMinusTSquared = oneMinusT * oneMinusT
    const oneMinusTCubed = oneMinusTSquared * oneMinusT
    const tSquared = t * t
    const tCubed = tSquared * t

    const x = oneMinusTCubed * p0.x +
      3 * oneMinusTSquared * t * p1.x +
      3 * oneMinusT * tSquared * p2.x +
      tCubed * p3.x

    const y = oneMinusTCubed * p0.y +
      3 * oneMinusTSquared * t * p1.y +
      3 * oneMinusT * tSquared * p2.y +
      tCubed * p3.y

    return { x, y }
  }

  const generateColorSteps = (band: ColorBand) => {
    return Array.from({ length: band.steps }, (_, i) => {
      // Calculate progress (0 to 1)
      const t = i / (band.steps - 1)
      
      // Get the point on the Bézier curve
      const point = calculateBezierPoint(
        t,
        band.curvePoints[0],
        band.curvePoints[1],
        band.curvePoints[2],
        band.curvePoints[3]
      )
      
      // Convert y position (150 to 0) to lightness (0 to 100)
      // 150 is the height of our curve editor
      const lightness = Math.max(0, Math.min(100, 100 - (point.y / 150 * 100)))
      
      return `hsl(${band.hue}, ${band.saturation}%, ${lightness}%)`
    })
  }

  const addColorBand = () => {
    const newId = Math.max(...colorBands.map(b => b.id)) + 1
    setColorBands([...colorBands, {
      id: newId,
      hue: Math.floor(Math.random() * 360),
      saturation: 100,
      lightness: 50,
      steps: 12,
      curvePoints: [
        { x: 0, y: 150 },
        { x: 66, y: 100 },
        { x: 133, y: 50 },
        { x: 200, y: 0 }
      ]
    }])
  }

  const removeColorBand = (id: number) => {
    setColorBands(colorBands.filter(band => band.id !== id))
  }

  const updateBand = (id: number, property: keyof ColorBand, value: number) => {
    setColorBands(colorBands.map(band => 
      band.id === id ? { ...band, [property]: value } : band
    ))
  }

  const handleCurveChange = (bandId: number, newPoints: Point[]) => {
    setColorBands(colorBands.map(band => 
      band.id === bandId ? { ...band, curvePoints: newPoints } : band
    ))
  }

  const updateGlobalSteps = (steps: number) => {
    setGlobalSteps(steps)
    setColorBands(colorBands.map(band => ({
      ...band,
      steps
    })))
  }

  const activeBand = colorBands.find(band => band.id === activeTab)

  // Add this helper function at the top of the component
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // Add this helper function at the top of the component
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
    return [
      Math.round(f(0) * 255),
      Math.round(f(8) * 255),
      Math.round(f(4) * 255)
    ];
  }

  return (
    <div className="color-generator">
      <div className="sidebar">
        <h2>Settings</h2>
        
        {/* Global Controls */}
        <div className="global-controls">
          <div className="control-group">
            <label>
              Global Steps ({globalSteps})
              <input
                type="range"
                min="2"
                max="20"
                value={globalSteps}
                onChange={(e) => updateGlobalSteps(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        {/* Band Tabs */}
        <div className="band-tabs">
          {colorBands.map(band => (
            <button
              key={band.id}
              className={`band-tab ${activeTab === band.id ? 'active' : ''}`}
              onClick={() => setActiveTab(band.id)}
            >
              Band {band.id}
            </button>
          ))}
          <button 
            className="add-band-btn"
            onClick={addColorBand}
          >
            +
          </button>
        </div>

        {/* Active Band Controls */}
        {activeBand && (
          <div className="band-control">
            <div className="band-header">
              <span className="band-title">Band {activeBand.id}</span>
              <button
                onClick={() => removeColorBand(activeBand.id)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>

            <div className="control-group">
              <label>
                Hue ({activeBand.hue}°)
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={activeBand.hue}
                  onChange={(e) => updateBand(activeBand.id, 'hue', Number(e.target.value))}
                />
              </label>
            </div>

            <div className="control-group">
              <label>
                Saturation ({activeBand.saturation}%)
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeBand.saturation}
                  onChange={(e) => updateBand(activeBand.id, 'saturation', Number(e.target.value))}
                />
              </label>
            </div>

            <div className="curve-editor-container">
              <h3>Lightness Curve</h3>
              <CurveEditor
                width={200}
                height={150}
                points={activeBand.curvePoints}
                onChange={(newPoints) => handleCurveChange(activeBand.id, newPoints)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="main-content">
        <h1>Color Palette Generator</h1>
        
        <div className="color-bands">
          {colorBands.map(band => (
            <div key={band.id} className="band-container">
              <div className="color-steps">
                <div className="band-title">Band {band.id}</div>
                {generateColorSteps(band).map((color, index) => {
                  // Parse the HSL values from the color string
                  const [h, s, l] = color.match(/\d+/g)!.map(Number);
                  const hexColor = hslToHex(h, s, l);
                  const [r, g, b] = hslToRgb(h, s, l);
                  
                  return (
                    <div
                      key={index}
                      className="color-step"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        navigator.clipboard.writeText(hexColor).then(() => {
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
                          el.textContent = `Copied ${hexColor}`;
                          document.body.appendChild(el);
                          setTimeout(() => el.remove(), 2000);
                        });
                      }}
                    >
                      <div className="color-info">
                        <div className="color-values">
                          <span>{hexColor}</span>
                          <span>rgba({r}, {g}, {b}, 1)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 