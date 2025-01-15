'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Slider.module.scss';

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number[];
  onChange: (values: number[]) => void;
  className?: string;
  disabled?: boolean;
}

const CustomSlider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ min, max, step, value, onChange, className = '', disabled = false }, ref) => {
    const [currentValue, setCurrentValue] = useState(value || [0]);
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const isControlled = value !== undefined;

    const getPercentage = (value: number) => {
      return ((value - min) / (max - min)) * 100;
    };

    const getValue = (percentage: number) => {
      const rawValue = (percentage * (max - min)) / 100 + min;
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.min(max, Math.max(min, steppedValue));
    };

    const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const percentage = ((event.clientX - rect.left) / rect.width) * 100;
      const newValue = getValue(percentage);
      const newValues = [newValue];

      if (!isControlled) {
        setCurrentValue(newValues);
      }
      onChange?.(newValues);
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      setIsDragging(true);
    };

    useEffect(() => {
      const handleMouseMove = (event: MouseEvent) => {
        if (!isDragging || disabled) return;
        
        const track = trackRef.current;
        if (!track) return;

        const rect = track.getBoundingClientRect();
        const percentage = ((event.clientX - rect.left) / rect.width) * 100;
        const newValue = getValue(percentage);
        const newValues = [newValue];

        if (!isControlled) {
          setCurrentValue(newValues);
        }
        onChange?.(newValues);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, disabled, isControlled, onChange]);

    useEffect(() => {
      if (value !== undefined) {
        setCurrentValue(value);
      }
    }, [value]);

    return (
      <div 
        ref={ref}
        className={`${styles['custom-slider']} ${disabled ? styles['custom-slider--disabled'] : ''} ${className}`}
      >
        <div 
          ref={trackRef}
          className={styles['custom-slider__track']}
          onClick={handleTrackClick}
        >
          <div 
            className={styles['custom-slider__range']}
            style={{ width: `${getPercentage(currentValue[0])}%` }}
          />
        </div>
        <div
          ref={thumbRef}
          className={`${styles['custom-slider__thumb']} ${isDragging ? styles['custom-slider__thumb--active'] : ''}`}
          style={{ left: `${getPercentage(currentValue[0])}%` }}
          onMouseDown={handleMouseDown}
        />
      </div>
    );
  }
);

CustomSlider.displayName = 'CustomSlider';

export { CustomSlider };