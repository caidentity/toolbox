'use client'

import { useState } from 'react'
import { Modal, ModalHeader, ModalContent } from '@/components/Modal/Modal'
import Button from '@/components/ui/Button'
import { ColorBand } from '@/tools/color-palette/types'
import { importColorBands } from './utils/importUtils'
import './ImportModal.scss'

interface ImportModalProps {
  isOpen: boolean
  onClose: (e?: React.MouseEvent) => void
  onImport: (bands: ColorBand[]) => void
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    try {
      const newBands = importColorBands(inputValue)
      onImport(newBands)
      onClose()
      setInputValue('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse color variables')
      console.error('Import error:', err)
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
            <li>SCSS: $colors-name-step: #hex;</li>
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