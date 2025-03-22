'use client';

import React, { useState, useRef, useEffect, ReactNode, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.scss';
import classNames from 'classnames';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipVariant = 'light' | 'dark' | 'primary' | 'success' | 'warning' | 'error';

// Interface for tooltip computed positioning data
interface TooltipPositionData {
  top: number;
  left: number;
  position: TooltipPosition;
}

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
  
  /**
   * Whether to use portal for rendering the tooltip
   * This prevents tooltips from being clipped by overflow: hidden containers
   */
  usePortal?: boolean;
  
  /**
   * Gap between the tooltip and the trigger element in pixels
   */
  offset?: number;
  
  /**
   * Whether to flip the tooltip position when it would go outside the viewport
   */
  autoFlip?: boolean;
}

// Hidden off-screen element used for measuring content
const OffscreenMeasurer = ({ children, onMeasure }: { children: ReactNode, onMeasure: (width: number, height: number) => void }) => {
  const measurer = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (measurer.current) {
      // Get the actual content dimensions
      const rect = measurer.current.getBoundingClientRect();
      const { offsetWidth, offsetHeight } = measurer.current;
      
      // Use the larger of offsetWidth/Height and getBoundingClientRect() width/height
      // This helps handle both text and complex content
      const width = Math.max(offsetWidth, rect.width);
      const height = Math.max(offsetHeight, rect.height);
      
      onMeasure(width, height);
    }
  }, [children, onMeasure]);
  
  return (
    <div
      ref={measurer}
      style={{
        position: 'absolute',
        visibility: 'hidden',
        top: '-9999px',
        left: '-9999px',
        width: 'auto',
        maxWidth: '350px', // Match max-width from CSS
        whiteSpace: 'normal', // Support multi-line text
        wordWrap: 'break-word',
        wordBreak: 'normal',
        padding: '8px 12px', // Match tooltip padding
        boxSizing: 'border-box',
        lineHeight: 1.5, // Match line height
        fontSize: '0.875rem', // Match font size
        zIndex: -1,
        // Use display inline-block to properly measure content width
        display: 'inline-block'
      }}
    >
      {children}
    </div>
  );
};

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
  usePortal = true,
  offset = 8,
  autoFlip = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isContentMeasured, setIsContentMeasured] = useState(false);
  const [computedPosition, setComputedPosition] = useState<TooltipPositionData | null>(null);
  const [activePosition, setActivePosition] = useState<TooltipPosition>(position);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const positionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  // Setup portal container
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we already have a tooltip container
      let container = document.getElementById('tooltip-portal-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'tooltip-portal-container';
        container.style.position = 'fixed';
        container.style.zIndex = '9999';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '0';
        container.style.height = '0';
        container.style.overflow = 'visible';
        document.body.appendChild(container);
      }
      setPortalContainer(container);
    }
  }, []);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (positionTimeoutRef.current) clearTimeout(positionTimeoutRef.current);
    };
  }, []);

  // Handle visibility based on forceVisible prop
  useEffect(() => {
    if (forceVisible !== undefined) {
      setIsVisible(forceVisible);
      if (forceVisible) {
        setIsRendered(true);
        // Delay position calculation until tooltip is rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(updatePosition);
        });
      }
    }
  }, [forceVisible]);

  // Handle content measurement
  const handleContentMeasure = (width: number, height: number) => {
    if (width > 0 && height > 0) {
      setMeasuredWidth(width);
      setMeasuredHeight(height);
      setIsContentMeasured(true);
    }
  };

  // Create hidden tooltip to measure content
  const measureTooltipDimensions = () => {
    if (!tooltipRef.current || typeof window === 'undefined') return;
    
    // Force layout calculation to get the correct dimensions
    const rect = tooltipRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, measuredWidth);
    const height = Math.max(rect.height, measuredHeight);
    
    if (width > 0 && width !== tooltipWidth) {
      setTooltipWidth(width);
    }
    
    if (height > 0 && height !== tooltipHeight) {
      setTooltipHeight(height);
    }
  };

  // Calculate tooltip position based on trigger element
  const updatePosition = () => {
    if (!containerRef.current || !tooltipRef.current || typeof window === 'undefined') return;

    // Measure content dimensions first
    measureTooltipDimensions();

    const triggerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newPosition: TooltipPosition = position;
    let top = 0;
    let left = 0;

    // Use the measured width/height if available, otherwise use the tooltip's current dimensions
    // Ensure we have at least the minimum width (180px)
    const tooltipHeightValue = Math.max(tooltipRect.height, measuredHeight, 30); // Lower minimum height
    const tooltipWidthValue = Math.max(tooltipRect.width, measuredWidth, minWidth || 180);

    // Use smaller offset (was offset=8 by default)
    const posOffset = offset || 4; // Reduced offset to be closer to trigger

    // Calculate initial position based on preferred position
    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipHeightValue - posOffset;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidthValue / 2);
        break;
      case 'bottom':
        top = triggerRect.bottom + posOffset;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidthValue / 2);
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipHeightValue / 2);
        left = triggerRect.left - tooltipWidthValue - posOffset;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipHeightValue / 2);
        left = triggerRect.right + posOffset;
        break;
    }

    // Check if tooltip is outside viewport and adjust/flip if necessary
    if (autoFlip) {
      // Detect horizontal overflow
      if (left < 0) {
        left = posOffset; // Smaller margin
      } else if (left + tooltipWidthValue > viewportWidth) {
        left = viewportWidth - tooltipWidthValue - posOffset; // Smaller margin
      }

      // Detect vertical overflow and flip position if needed
      if (position === 'top' && top < 0) {
        top = triggerRect.bottom + posOffset;
        newPosition = 'bottom';
      } else if (position === 'bottom' && top + tooltipHeightValue > viewportHeight) {
        top = triggerRect.top - tooltipHeightValue - posOffset;
        newPosition = 'top';
      } else if (position === 'left' && left < 0) {
        left = triggerRect.right + posOffset;
        newPosition = 'right';
      } else if (position === 'right' && left + tooltipWidthValue > viewportWidth) {
        left = triggerRect.left - tooltipWidthValue - posOffset;
        newPosition = 'left';
      }
    }

    setActivePosition(newPosition);
    setComputedPosition({ top, left, position: newPosition });
  };

  // Two-phase rendering to ensure proper dimensions
  useEffect(() => {
    if (isVisible && !isRendered) {
      setIsRendered(true);
    } else if (!isVisible && isRendered) {
      // Delay hiding the rendered content to allow for a smooth transition
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, delayHide + 50);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isRendered, delayHide]);

  // Update position when tooltip becomes visible or window resizes
  useEffect(() => {
    if (isRendered) {
      // Clear any existing position timeout
      if (positionTimeoutRef.current) {
        clearTimeout(positionTimeoutRef.current);
      }
      
      // Schedule position update with a delay to ensure content is rendered
      positionTimeoutRef.current = setTimeout(() => {
        updatePosition();
        // Schedule another update after a short delay to handle any post-render adjustments
        positionTimeoutRef.current = setTimeout(updatePosition, 50);
      }, 10);
      
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    
    return () => {
      if (positionTimeoutRef.current) {
        clearTimeout(positionTimeoutRef.current);
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isRendered, position, tooltipWidth, tooltipHeight, measuredWidth, measuredHeight]);

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
    styles[activePosition],
    styles[variant],
    isVisible ? styles.visible : styles.hidden,
    className
  );

  // Calculate proper width for the tooltip - using various sources to get accurate width
  const finalWidth = usePortal 
    ? Math.max(
        minWidth || 0, 
        Math.min(
          maxWidth || 350,
          // Use measured content width as primary source of truth, with a small buffer
          // This ensures the tooltip properly hugs the content
          measuredWidth > 0 ? Math.ceil(measuredWidth * 1.05) : 180
        )
      )
    : undefined;

  // Combine custom style with min/max width if provided
  const tooltipStyle: CSSProperties = {
    ...(style || {}),
    ...(minWidth !== undefined ? { minWidth: `${minWidth}px` } : {}),
    ...(maxWidth !== undefined ? { maxWidth: `${maxWidth}px` } : {}),
    // Set explicit width when using portal, to ensure content hugging
    ...(finalWidth && usePortal ? { width: `${finalWidth}px` } : {}),
    ...(computedPosition && usePortal ? {
      position: 'fixed',
      top: `${computedPosition.top}px`,
      left: `${computedPosition.left}px`,
      transform: 'none',
      // Use flexbox to ensure content is properly contained
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      // Let height be determined by content
      height: 'auto',
      // Prevent any overflow issues
      overflow: 'visible'
    } : {})
  };

  if (disabled) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <div 
      className={tooltipClasses} 
      style={tooltipStyle} 
      role="tooltip"
      ref={tooltipRef}
      data-testid="tooltip"
    >
      <div className={styles.contentWrapper} ref={contentRef}>
        {content}
      </div>
      {showArrow && <span className={styles.arrow} />}
    </div>
  );

  return (
    <>
      {/* Off-screen measurer to get accurate content dimensions */}
      {!isContentMeasured && <OffscreenMeasurer onMeasure={handleContentMeasure}>{content}</OffscreenMeasurer>}
      
      <div 
        className={styles.tooltipContainer}
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {children}
        {isRendered && (
          usePortal && portalContainer 
            ? createPortal(tooltipContent, portalContainer)
            : tooltipContent
        )}
      </div>
    </>
  );
};

export default Tooltip; 