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
              <h3 className="band-title">Band {band.id}</h3>
              <div className="color-steps">
                {generateColorSteps(band).map((color, index) => (
                  <div
                    key={index}
                    className="color-step"
                    style={{ backgroundColor: color }}
                  >
                    <div className="color-info">
                      <span>{color}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 