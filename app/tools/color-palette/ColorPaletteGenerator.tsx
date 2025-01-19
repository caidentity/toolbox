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
  name: string
}

interface Point {
  x: number
  y: number
}

// Add this color naming function
const generateColorName = (hue: number, saturation: number): string => {
  const colorNames: { range: [number, number]; names: { [key: string]: string[] } }[] = [
    {
      range: [350, 10], // True reds
      names: {
        high: ['Ruby', 'Crimson', 'Scarlet', 'Cardinal', 'Cherry', 'Fire'],
        low: ['Rose', 'Coral', 'Salmon', 'Terra Cotta', 'Brick']
      }
    },
    {
      range: [11, 40], // Oranges
      names: {
        high: ['Tangerine', 'Orange', 'Amber', 'Marigold', 'Rust', 'Carrot'],
        low: ['Peach', 'Apricot', 'Melon', 'Cantaloupe', 'Sand']
      }
    },
    {
      range: [41, 65], // Yellows
      names: {
        high: ['Sunshine', 'Lemon', 'Gold', 'Honey', 'Daffodil', 'Canary'],
        low: ['Butter', 'Cream', 'Wheat', 'Vanilla', 'Banana', 'Straw']
      }
    },
    {
      range: [66, 150], // Greens
      names: {
        high: ['Emerald', 'Kelly', 'Forest', 'Jade', 'Pine', 'Shamrock', 'Juniper'],
        low: ['Sage', 'Mint', 'Seafoam', 'Pistachio', 'Moss', 'Fern', 'Olive']
      }
    },
    {
      range: [151, 190], // Cyan/Turquoise
      names: {
        high: ['Turquoise', 'Teal', 'Aqua', 'Ocean', 'Caribbean', 'Lagoon'],
        low: ['Sky', 'Powder', 'Azure', 'Robin', 'Crystal', 'Mist']
      }
    },
    {
      range: [191, 250], // Blues
      names: {
        high: ['Sapphire', 'Cobalt', 'Navy', 'Royal', 'Indigo', 'Cerulean', 'Arctic'],
        low: ['Cornflower', 'Steel', 'Periwinkle', 'Denim', 'Baby Blue', 'Cloud']
      }
    },
    {
      range: [251, 290], // Purples
      names: {
        high: ['Royal', 'Violet', 'Amethyst', 'Grape', 'Eggplant', 'Byzantium'],
        low: ['Lavender', 'Lilac', 'Wisteria', 'Thistle', 'Heather', 'Iris']
      }
    },
    {
      range: [291, 330], // Magentas
      names: {
        high: ['Magenta', 'Fuchsia', 'Purple', 'Wine', 'Mulberry', 'Burgundy'],
        low: ['Orchid', 'Plum', 'Mauve', 'Raspberry', 'Mallow', 'Dusty Rose']
      }
    },
    {
      range: [331, 349], // Pink-Reds
      names: {
        high: ['Hot Pink', 'Berry', 'Cerise', 'Ruby Rose', 'Punch', 'Watermelon'],
        low: ['Pink', 'Blush', 'Rose', 'Flamingo', 'Petal', 'Ballet']
      }
    }
  ]

  const normalizedHue = ((hue % 360) + 360) % 360
  const colorRange = colorNames.find(({ range }) => {
    if (range[0] > range[1]) {
      return normalizedHue >= range[0] || normalizedHue <= range[1]
    }
    return normalizedHue >= range[0] && normalizedHue <= range[1]
  })

  if (!colorRange) return 'Color'

  const intensityKey = saturation > 65 ? 'high' : 'low'
  const possibleNames = colorRange.names[intensityKey]
  
  return possibleNames[Math.floor(Math.random() * possibleNames.length)]
}

export default function ColorPaletteGenerator() {
  const [colorBands, setColorBands] = useState<ColorBand[]>([
    {
      id: 1,
      hue: 0,
      saturation: 100,
      lightness: 50,
      steps: 12,
      name: 'Ruby',
      curvePoints: [
        { x: 0, y: 150 },
        { x: 66, y: 100 },
        { x: 133, y: 50 },
        { x: 200, y: 0 }
      ]
    },
    { id: 2, hue: 120, saturation: 100, lightness: 50, steps: 12, name: 'Sapphire', curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
    { id: 3, hue: 240, saturation: 100, lightness: 50, steps: 12, name: 'Emerald', curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
    { id: 4, hue: 60, saturation: 100, lightness: 50, steps: 12, name: 'Ruby', curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
    { id: 5, hue: 180, saturation: 100, lightness: 50, steps: 12, name: 'Sapphire', curvePoints: [
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
    const newHue = Math.floor(Math.random() * 360)
    const newSaturation = 100
    
    setColorBands([...colorBands, {
      id: newId,
      hue: newHue,
      saturation: newSaturation,
      lightness: 50,
      steps: 12,
      name: generateColorName(newHue, newSaturation),
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
    setColorBands(colorBands.map(band => {
      if (band.id === id) {
        const updatedBand = { ...band, [property]: value }
        // Regenerate name if hue or saturation changes
        if (property === 'hue' || property === 'saturation') {
          updatedBand.name = generateColorName(updatedBand.hue, updatedBand.saturation)
        }
        return updatedBand
      }
      return band
    }))
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
              {band.name}
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
              <span className="band-title">{activeBand.name}</span>
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
                <div className="band-title">{band.name}</div>
                {generateColorSteps(band).map((color, index) => {
                  // Parse the HSL values from the color string
                  const [h, s, l] = color.match(/\d+/g)!.map(Number);
                  const hexColor = hslToHex(h, s, l);
                  
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
                        <span>{hexColor}</span>
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