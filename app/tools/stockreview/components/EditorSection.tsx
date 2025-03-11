import React, { ReactNode, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';

interface EditorSectionProps {
  /**
   * Section title
   */
  title: string;
  
  /**
   * Whether this section can be toggled on/off
   * @default false
   */
  toggleable?: boolean;
  
  /**
   * Whether this section is enabled (when toggleable)
   * Only used when toggleable is true
   */
  enabled?: boolean;
  
  /**
   * Function called when the toggle checkbox changes
   * Only used when toggleable is true
   */
  onToggleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  
  /**
   * ID for the toggle checkbox
   * Only used when toggleable is true
   */
  toggleId?: string;
  
  /**
   * Children content for the editor section
   */
  children: ReactNode;
}

/**
 * Pure UI component for editor sections
 */
const EditorSection: React.FC<EditorSectionProps> = ({
  title,
  toggleable = false,
  enabled = true,
  onToggleChange,
  toggleId,
  children,
}) => {
  const id = toggleId || `toggle-${title.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="editor-section">
      <div className="flex items-center justify-between mb-2">
        <h3 className="editor-section-title">{title}</h3>
        {toggleable && (
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id={id}
              checked={enabled}
              onChange={onToggleChange}
              className="rounded border-gray-300"
            />
            <Label htmlFor={id}>Include</Label>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default EditorSection; 