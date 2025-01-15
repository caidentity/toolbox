// File: Select.tsx
"use client"

import * as React from "react"
import { ChevronDown, X } from "lucide-react"
import styles from './Select.module.scss'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value?: string | string[]
  onChange: (value: string | string[]) => void
  placeholder?: string
  className?: string
  isMulti?: boolean
  disabled?: boolean
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  isMulti = false,
  disabled = false
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedValues = React.useMemo(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  const handleSelect = (optionValue: string) => {
    if (isMulti) {
      const newValue = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue]
      onChange(newValue)
    } else {
      onChange(optionValue)
      setIsOpen(false)
    }
  }

  const removeValue = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMulti) {
      onChange(selectedValues.filter(v => v !== optionValue))
    }
  }

  const displayValue = () => {
    if (selectedValues.length === 0) return placeholder
    
    const selectedOptions = options.filter(opt => selectedValues.includes(opt.value))
    
    if (!isMulti) {
      return selectedOptions[0]?.label
    }

    return (
      <div className={styles['select-multi-value']}>
        {selectedOptions.map(option => (
          <span key={option.value} className={styles['select-multi-value-item']}>
            {option.label}
            <X
              className={styles['select-multi-value-remove']}
              onClick={(e) => removeValue(option.value, e)}
            />
          </span>
        ))}
      </div>
    )
  }

  return (
    <div ref={selectRef} className={styles['select-container']}>
      <div
        ref={ref}
        className={cn(
          styles['select-trigger'],
          isOpen && styles['select-trigger--open'],
          disabled && styles['select-trigger--disabled'],
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className={styles['select-value']}>{displayValue()}</div>
        <ChevronDown className={cn(
          styles['select-trigger__icon'],
          isOpen && styles['select-trigger__icon--open']
        )} />
      </div>

      {isOpen && !disabled && (
        <div className={styles['select-content']}>
          <div className={styles['select-viewport']}>
            {options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  styles['select-item'],
                  selectedValues.includes(option.value) && styles['select-item--selected'],
                  option.disabled && styles['select-item--disabled']
                )}
                onClick={() => !option.disabled && handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

Select.displayName = 'Select'