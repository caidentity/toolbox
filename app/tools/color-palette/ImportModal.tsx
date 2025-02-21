'use client'

import { useState } from 'react'
import { Modal, ModalHeader, ModalContent } from '@/components/Modal/Modal'
import Button from '@/components/ui/Button'
import { ColorBand } from '@/tools/color-palette/types'
import './ImportModal.scss'

interface ImportModalProps {
  isOpen: boolean
  onClose: (e?: React.MouseEvent) => void
  onImport: (bands: ColorBand[]) => void
}

interface ParsedColor {
  name: string
  step: number
  hex: string
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const parseInput = (input: string): ParsedColor[] => {
    const colors: ParsedColor[] = []
    
    // Split input into lines and process each line
    const lines = input.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      // Match SCSS/CSS variable pattern
      const scssMatch = line.match(/\$([\w-]+)-(\d+):\s*(#[A-Fa-f0-9]{6});?/)
      const cssMatch = line.match(/--?([\w-]+)-(\d+):\s*(#[A-Fa-f0-9]{6});?/)
      
      if (scssMatch) {
        colors.push({
          name: scssMatch[1],
          step: parseInt(scssMatch[2]),
          hex: scssMatch[3]
        })
      } else if (cssMatch) {
        colors.push({
          name: cssMatch[1],
          step: parseInt(cssMatch[2]),
          hex: cssMatch[3]
        })
      }
    }
    
    return colors
  }

  const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
    // Remove the # if present
    hex = hex.replace('#', '')
    
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      
      h *= 60
    }
    
    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  const handleImport = () => {
    try {
      const parsedColors = parseInput(inputValue)
      if (parsedColors.length === 0) {
        setError('No valid color definitions found')
        return
      }

      // Group colors by name
      const colorGroups = parsedColors.reduce((acc, color) => {
        if (!acc[color.name]) {
          acc[color.name] = []
        }
        acc[color.name].push(color)
        return acc
      }, {} as Record<string, ParsedColor[]>)

      // Convert to ColorBand format
      const newBands: ColorBand[] = Object.entries(colorGroups).map(([name, colors]) => {
        // Use the middle color (around 500) to determine the base HSL values
        const middleColor = colors.find(c => c.step === 500) || colors[Math.floor(colors.length / 2)]
        const hsl = hexToHSL(middleColor.hex)

        return {
          id: Math.random(), // You might want to use a more robust ID generation
          name: name,
          hue: hsl.h,
          saturation: hsl.s,
          lightness: 50, // We'll use 50 as default and let the curve handle variations
          steps: colors.length,
          curvePoints: [
            { x: 0, y: 150 },
            { x: 66, y: 100 },
            { x: 133, y: 50 },
            { x: 200, y: 0 }
          ]
        }
      })

      onImport(newBands)
      onClose()
      setInputValue('')
      setError(null)
    } catch (err) {
      setError('Failed to parse input')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName="import-modal"
    >
      <ModalHeader
        title="Import Colors"
        onClose={onClose}
        showCloseButton
      />
      <ModalContent>
        <div className="import-description">
          Paste your color variables below. Supported formats:
          <ul>
            <li>SCSS: $color-name-step: #hex;</li>
            <li>CSS: --color-name-step: #hex;</li>
          </ul>
        </div>
        
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Paste your color variables here..."
          rows={10}
          className="import-textarea"
        />
        
        {error && (
          <div className="import-error">
            {error}
          </div>
        )}
        
        <div className="import-actions">
          <Button
            variant="ghost"
            onClick={(e) => onClose(e)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!inputValue.trim()}
          >
            Import
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
} 