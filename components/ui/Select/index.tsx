// File: Select.tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown } from "lucide-react"
import styles from './Select.module.scss';
import { cn } from '@/lib/utils';

// Root component
const Select = SelectPrimitive.Root

// Trigger component
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(styles['select-trigger'], className)}
    {...props}
  >
    <span className={styles['select-value']}>{children}</span>
    <ChevronDown className={styles['select-trigger__icon']} />
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// Value component
const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Value
    ref={ref}
    className={`select-value ${className || ''}`}
    {...props}
  >
    {children}
  </SelectPrimitive.Value>
))
SelectValue.displayName = SelectPrimitive.Value.displayName

// Content component
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        styles['select-content'],
        position === "popper" && styles['select-content--popper'],
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport 
        className={cn(
          styles['select-viewport'],
          position === "popper" && styles['select-viewport--popper']
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

// Item component
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(styles['select-item'], className)}
    {...props}
  >
    <span className={styles['select-item__indicator']}>
      <SelectPrimitive.ItemIndicator>
        <ChevronDown className={styles['select-item__icon']} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

// Additional components that may be useful
const SelectGroup = SelectPrimitive.Group
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(styles['select-label'], className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(styles['select-separator'], className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}