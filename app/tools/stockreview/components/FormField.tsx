import React, { ReactNode, ChangeEvent } from 'react';
import Tooltip from '@/components/ui/Tooltip';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type InputType = 'text' | 'number' | 'checkbox';

interface FormFieldProps {
  /**
   * Unique ID for the form field (used for label association)
   */
  id: string;
  
  /**
   * Label text to display
   */
  label: string;
  
  /**
   * Type of input field
   * @default 'text'
   */
  type?: InputType;
  
  /**
   * Current value of the field
   */
  value: string | number | boolean;
  
  /**
   * Function called when the input changes
   * Passes the raw event to parent for handling
   */
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Optional tooltip content for help text
   */
  tooltipContent?: ReactNode;
  
  /**
   * Minimum value (for number inputs)
   */
  min?: number;
  
  /**
   * Maximum value (for number inputs)
   */
  max?: number;
  
  /**
   * Layout direction of the form field
   * @default 'vertical'
   */
  layout?: 'vertical' | 'horizontal';
}

/**
 * Purely UI form field component that supports different input types
 * and flexible layouts for label/input positioning
 */
const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onInputChange,
  disabled = false,
  tooltipContent,
  min,
  max,
  layout = 'vertical',
}) => {
  const isHorizontal = layout === 'horizontal';
  const wrapperClassName = isHorizontal 
    ? 'flex items-center justify-between gap-4' 
    : 'space-y-2';
  
  const renderLabel = () => (
    <Label htmlFor={id} className={isHorizontal ? 'mb-0' : ''}>
      {label}
      {tooltipContent && (
        <Tooltip
          content={tooltipContent}
          position="top"
          variant="light"
          minWidth={250}
          maxWidth={350}
        >
          <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
        </Tooltip>
      )}
    </Label>
  );

  if (type === 'checkbox') {
    return (
      <div className={isHorizontal ? 'flex items-center justify-between' : 'checkbox-wrapper'}>
        {isHorizontal && renderLabel()}
        <div className={!isHorizontal ? 'flex items-center' : ''}>
          <input
            type="checkbox"
            id={id}
            checked={value as boolean}
            onChange={onInputChange}
            disabled={disabled}
            className="rounded border-gray-300"
          />
          {!isHorizontal && (
            <Label htmlFor={id} className="ml-2">
              {label}
              {tooltipContent && (
                <Tooltip
                  content={tooltipContent}
                  position="top"
                  variant="light"
                  minWidth={250}
                  maxWidth={350}
                >
                  <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                </Tooltip>
              )}
            </Label>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      {renderLabel()}
      <div className={isHorizontal ? 'w-1/2' : ''}>
        <Input
          id={id}
          type={type}
          value={value as string | number}
          onChange={onInputChange}
          disabled={disabled}
          min={min}
          max={max}
        />
      </div>
    </div>
  );
};

export default FormField; 