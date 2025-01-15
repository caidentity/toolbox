'use client'

import { useState } from 'react'
import './ColorPaletteGenerator.scss'

interface ColorBand {
  id: number
  hue: number
  saturation: number
  lightness: number
  steps: number
}

export default function ColorPaletteGenerator() {
  const [colorBands, setColorBands] = useState<ColorBand[]>([
    { id: 1, hue: 0, saturation: 100, lightness: 50, steps: 12 },
    { id: 2, hue: 120, saturation: 100, lightness: 50, steps: 12 },
    { id: 3, hue: 240, saturation: 100, lightness: 50, steps: 12 },
    { id: 4, hue: 60, saturation: 100, lightness: 50, steps: 12 },
    { id: 5, hue: 180, saturation: 100, lightness: 50, steps: 12 },
  ])

  const generateColorSteps = (band: ColorBand) => {
    return Array.from({ length: band.steps }, (_, i) => {
      const lightness = (i * (100 / (band.steps - 1)))
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
      steps: 12
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

  return (
    <div className="color-generator">
      <div className="sidebar">
        <h2>Settings</h2>
        
        <button
          onClick={addColorBand}
          className="add-band-btn"
        >
          Add Color Band
        </button>

        <div className="bands-controls">
          {colorBands.map(band => (
            <div key={band.id} className="band-control">
              <div className="band-header">
                <span className="band-title">Band {band.id}</span>
                <button
                  onClick={() => removeColorBand(band.id)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>

              <div className="control-group">
                <label>
                  Hue ({band.hue}°)
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={band.hue}
                    onChange={(e) => updateBand(band.id, 'hue', Number(e.target.value))}
                  />
                </label>
              </div>

              <div className="control-group">
                <label>
                  Saturation ({band.saturation}%)
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={band.saturation}
                    onChange={(e) => updateBand(band.id, 'saturation', Number(e.target.value))}
                  />
                </label>
              </div>

              <div className="control-group">
                <label>
                  Steps ({band.steps})
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={band.steps}
                    onChange={(e) => updateBand(band.id, 'steps', Number(e.target.value))}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
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