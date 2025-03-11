import React, { ReactNode } from 'react';
import Tooltip from '@/components/ui/Tooltip';

interface SummaryCardProps {
  /**
   * The label text to display for this summary item
   */
  label: string;
  
  /**
   * The value to display (typically a formatted currency value)
   */
  value: string;
  
  /**
   * Content for the tooltip - can be a simple string or complex React component
   */
  tooltipContent: ReactNode;
  
  /**
   * Position for the tooltip relative to the info icon
   * @default 'top'
   */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  /**
   * Width constraints for the tooltip
   * @default { min: 200, max: 300 }
   */
  tooltipWidth?: {
    min?: number;
    max?: number;
  };
  
  /**
   * Custom class name for the summary card
   */
  className?: string;
}

/**
 * SummaryCard component for displaying labeled values with tooltips
 * Used in the Stock Review Calculator to display summarized information
 */
const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  tooltipContent,
  tooltipPosition = 'top',
  tooltipWidth = { min: 200, max: 300 },
  className,
}) => {
  return (
    <div className={`summary-item ${className || ''}`}>
      <div className="summary-item-label">
        {label}
        <Tooltip
          content={tooltipContent}
          position={tooltipPosition}
          variant="light"
          minWidth={tooltipWidth.min}
          maxWidth={tooltipWidth.max}
        >
          <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
            ⓘ
          </span>
        </Tooltip>
      </div>
      <div className="summary-item-value">{value}</div>
    </div>
  );
};

export default SummaryCard; 