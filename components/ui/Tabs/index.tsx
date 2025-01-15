"use client"

import * as React from "react";
import { cn } from "@/lib/utils";
import "./Tabs.module.scss";

type TabsValue = 'percentage' | 'shares'

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: TabsValue
  value?: TabsValue
  onValueChange?: (value: TabsValue) => void
  children: React.ReactNode
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: TabsValue
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: TabsValue
}

const TabsContext = React.createContext<{
  value: TabsValue
  onValueChange: (value: TabsValue) => void
}>({ value: 'percentage', onValueChange: () => {} })

const Tabs = ({ defaultValue = 'percentage', value, onValueChange, children, className, ...props }: TabsProps) => {
  const [selectedValue, setSelectedValue] = React.useState<TabsValue>(value || defaultValue)

  const handleValueChange = React.useCallback((newValue: TabsValue) => {
    if (!value) {
      setSelectedValue(newValue)
    }
    onValueChange?.(newValue)
  }, [value, onValueChange])

  return (
    <TabsContext.Provider value={{ value: value || selectedValue, onValueChange: handleValueChange }}>
      <div className={cn('tabs', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('tabs-list', className)}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  )
)
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(TabsContext)
    const isActive = selectedValue === value

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        className={cn(
          'tabs-trigger',
          isActive && 'tabs-trigger--active',
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue } = React.useContext(TabsContext)
    const isSelected = selectedValue === value

    if (!isSelected) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('tabs-content', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent } 