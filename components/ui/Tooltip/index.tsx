'use client';

import React, { useState, useRef, useEffect, ReactNode, CSSProperties } from 'react';
import styles from './Tooltip.module.scss';
import classNames from 'classnames';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipVariant = 'light' | 'dark' | 'primary' | 'success' | 'warning' | 'error';

export interface TooltipProps {
  /**
   * The content to display inside the tooltip
   */
  content: ReactNode;
  
  /**
   * Whether to show the tooltip arrow
   */
  showArrow?: boolean;
  
  /**
   * Position of the tooltip relative to its trigger element
   */
  position?: TooltipPosition;
  
  /**
   * Tooltip color variant
   */
  variant?: TooltipVariant;
  
  /**
   * Additional classes to apply to the tooltip
   */
  className?: string;
  
  /**
   * Whether the tooltip is disabled
   */
  disabled?: boolean;
  
  /**
   * Delay in ms before showing the tooltip
   */
  delayShow?: number;
  
  /**
   * Delay in ms before hiding the tooltip
   */
  delayHide?: number;
  
  /**
   * Custom styles to apply to the tooltip
   */
  style?: CSSProperties;
  
  /**
   * The element that triggers the tooltip
   */
  children: ReactNode;
  
  /**
   * Whether to force the tooltip to be visible (controlled mode)
   */
  forceVisible?: boolean;
  
  /**
   * Minimum width of the tooltip in pixels
   */
  minWidth?: number;
  
  /**
   * Maximum width of the tooltip in pixels
   */
  maxWidth?: number;
}

/**
 * Tooltip component that provides additional information on hover
 */
const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  variant = 'dark',
  showArrow = true,
  className = '',
  disabled = false,
  delayShow = 300,
  delayHide = 200,
  style,
  forceVisible,
  minWidth,
  maxWidth,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Handle visibility based on forceVisible prop
  useEffect(() => {
    if (forceVisible !== undefined) {
      setIsVisible(forceVisible);
    }
  }, [forceVisible]);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(forceVisible !== undefined ? forceVisible : false);
    }, delayHide);
  };

  const tooltipClasses = classNames(
    styles.tooltip,
    styles[position],
    styles[variant],
    isVisible ? styles.visible : styles.hidden,
    className
  );

  // Combine custom style with min/max width if provided
  const tooltipStyle: CSSProperties = {
    ...(style || {}),
    ...(minWidth !== undefined ? { minWidth: `${minWidth}px` } : {}),
    ...(maxWidth !== undefined ? { maxWidth: `${maxWidth}px` } : {}),
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div 
      className={styles.tooltipContainer}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <div className={tooltipClasses} style={tooltipStyle} role="tooltip">
        {content}
        {showArrow && <span className={styles.arrow} />}
      </div>
    </div>
  );
};

export default Tooltip; 