import React from 'react';
import { BaseColor } from './types';
import { CurveEditor } from './CurveEditor';
import styles from './ColorPaletteGenerator.module.css';

interface SidebarProps {
  baseColors: BaseColor[];
  selectedColor: number;
  setSelectedColor: (index: number) => void;
  addNewRow: () => void;
  removeRow: (index: number) => void;
  updateBaseColor: (index: number, property: keyof BaseColor, value: any) => void;
}

export function Sidebar({
  baseColors,
  selectedColor,
  setSelectedColor,
  addNewRow,
  removeRow,
  updateBaseColor
}: SidebarProps) {
  return (
    <div className={styles.sidebar}>
      <h3 className={styles.sidebarTitle}>Colors</h3>
      
      {/* Color Swatches */}
      <div className={styles.colorGrid}>
        {baseColors.map((color, index) => (
          <button
            key={index}
            className={`${styles.colorSwatch} ${selectedColor === index ? styles.selected : ''}`}
            style={{ 
              backgroundColor: `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`
            }}
            onClick={() => setSelectedColor(index)}
          />
        ))}
        <button 
          className={styles.addColorButton}
          onClick={addNewRow}
        >
          +
        </button>
      </div>

      {baseColors[selectedColor] && (
        <div className={styles.colorControls}>
          <div className={styles.controlHeader}>
            <label className={styles.label}>Name</label>
            <button 
              className={styles.deleteButton}
              onClick={() => removeRow(selectedColor)}
            >
              🗑️
            </button>
          </div>

          <input
            type="text"
            className={styles.input}
            value={baseColors[selectedColor].name}
            onChange={(e) => updateBaseColor(selectedColor, 'name', e.target.value)}
          />

          <label className={styles.label}>Hue (0-360)</label>
          <input
            type="number"
            className={styles.input}
            min="0"
            max="360"
            value={baseColors[selectedColor].hue}
            onChange={(e) => updateBaseColor(selectedColor, 'hue', parseInt(e.target.value) || 0)}
          />

          <label className={styles.label}>Saturation</label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="100"
              value={baseColors[selectedColor].saturation}
              onChange={(e) => updateBaseColor(selectedColor, 'saturation', parseInt(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{baseColors[selectedColor].saturation}%</span>
          </div>

          <label className={styles.label}>Intensity Curve</label>
          <CurveEditor
            points={baseColors[selectedColor].curvePoints}
            onChange={(newPoints) => updateBaseColor(selectedColor, 'curvePoints', newPoints)}
            width={200}
            height={150}
          />
          <div className={styles.curveHelp}>
            Drag blue points to adjust intensity curve
          </div>
        </div>
      )}
    </div>
  );
} 