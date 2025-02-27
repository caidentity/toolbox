'use client'

import { useState, useReducer, useEffect, useMemo } from 'react'
import CurveEditor from './CurveEditor'
import './ColorPaletteGenerator.scss'
import { CustomSlider } from '@/components/ui/Slider'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Menu } from '@/components/ui/Menu'
import { ImportModal } from './ImportModal'
import { ColorBand, Point, StepNameFormat, MenuType } from './types'

// Add this color naming function
const generateColorName = (hue: number, saturation: number): string => {
  const colorNames: { range: [number, number]; names: { [key: string]: string[] } }[] = [
    {
      range: [350, 10], // True reds
      names: {
        high: ['Ruby', 'Crimson', 'Scarlet', 'Cardinal', 'Cherry', 'Fire'],
        low: ['Rose', 'Coral', 'Salmon', 'Terra Cotta', 'Brick']
      }
    },
    {
      range: [11, 40], // Oranges
      names: {
        high: ['Tangerine', 'Orange', 'Amber', 'Marigold', 'Rust', 'Carrot'],
        low: ['Peach', 'Apricot', 'Melon', 'Cantaloupe', 'Sand']
      }
    },
    {
      range: [41, 65], // Yellows
      names: {
        high: ['Sunshine', 'Lemon', 'Gold', 'Honey', 'Daffodil', 'Canary'],
        low: ['Butter', 'Cream', 'Wheat', 'Vanilla', 'Banana', 'Straw']
      }
    },
    {
      range: [66, 150], // Greens
      names: {
        high: ['Emerald', 'Kelly', 'Forest', 'Jade', 'Pine', 'Shamrock', 'Juniper'],
        low: ['Sage', 'Mint', 'Seafoam', 'Pistachio', 'Moss', 'Fern', 'Olive']
      }
    },
    {
      range: [151, 190], // Cyan/Turquoise
      names: {
        high: ['Turquoise', 'Teal', 'Aqua', 'Ocean', 'Caribbean', 'Lagoon'],
        low: ['Sky', 'Powder', 'Azure', 'Robin', 'Crystal', 'Mist']
      }
    },
    {
      range: [191, 250], // Blues
      names: {
        high: ['Sapphire', 'Cobalt', 'Navy', 'Royal', 'Indigo', 'Cerulean', 'Arctic'],
        low: ['Cornflower', 'Steel', 'Periwinkle', 'Denim', 'Baby Blue', 'Cloud']
      }
    },
    {
      range: [251, 290], // Purples
      names: {
        high: ['Royal', 'Violet', 'Amethyst', 'Grape', 'Eggplant', 'Byzantium'],
        low: ['Lavender', 'Lilac', 'Wisteria', 'Thistle', 'Heather', 'Iris']
      }
    },
    {
      range: [291, 330], // Magentas
      names: {
        high: ['Magenta', 'Fuchsia', 'Purple', 'Wine', 'Mulberry', 'Burgundy'],
        low: ['Orchid', 'Plum', 'Mauve', 'Raspberry', 'Mallow', 'Dusty Rose']
      }
    },
    {
      range: [331, 349], // Pink-Reds
      names: {
        high: ['Hot Pink', 'Berry', 'Cerise', 'Ruby Rose', 'Punch', 'Watermelon'],
        low: ['Pink', 'Blush', 'Rose', 'Flamingo', 'Petal', 'Ballet']
      }
    }
  ]

  const normalizedHue = ((hue % 360) + 360) % 360
  const colorRange = colorNames.find(({ range }) => {
    if (range[0] > range[1]) {
      return normalizedHue >= range[0] || normalizedHue <= range[1]
    }
    return normalizedHue >= range[0] && normalizedHue <= range[1]
  })

  if (!colorRange) return 'Color'

  const intensityKey = saturation > 65 ? 'high' : 'low'
  const possibleNames = colorRange.names[intensityKey]
  
  return possibleNames[Math.floor(Math.random() * possibleNames.length)]
}

interface SettingControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  onReset?: () => void;
}

function SettingControl({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  unit = '', 
  onChange, 
  onReset 
}: SettingControlProps) {
  return (
    <div className="control-group">
      <div className="control-header">
        <label>{label}</label>
        <div className="value-controls">
          {onReset && (
            <Button
              size="xs"
              variant="ghost"
              onClick={onReset}
            >
              Reset
            </Button>
          )}
          <span className="value-display">
            {value}{unit}
          </span>
        </div>
      </div>
      <CustomSlider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onChange={([newValue]) => onChange(newValue)}
      />
    </div>
  );
}

// Add these utility functions for better contrast calculations
const sRGBtoLin = (colorChannel: number): number => {
  // Convert sRGB color channel to linear RGB
  const c = colorChannel / 255.0;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const calculateLuminance = (r: number, g: number, b: number): number => {
  // Calculate relative luminance
  const rLin = sRGBtoLin(r);
  const gLin = sRGBtoLin(g);
  const bLin = sRGBtoLin(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
};

const calculateContrastRatio = (l1: number, l2: number): number => {
  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const getContrastTextColor = (h: number, s: number, l: number): string => {
  // Convert HSL to RGB
  const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;

  let r = 0, g = 0, b = 0;
  
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  // Convert to RGB values (0-255)
  const red = Math.round((r + m) * 255);
  const green = Math.round((g + m) * 255);
  const blue = Math.round((b + m) * 255);

  // Calculate background luminance
  const bgLuminance = calculateLuminance(red, green, blue);

  // Test contrast with pure white and pure black
  const whiteContrast = calculateContrastRatio(1, bgLuminance);
  const blackContrast = calculateContrastRatio(0, bgLuminance);

  // If neither pure white nor pure black meets 4.5:1, try enhanced contrast colors
  if (whiteContrast < 4.5 && blackContrast < 4.5) {
    // Create enhanced contrast colors
    const enhancedWhite = 'rgba(255, 255, 255, 0.95)';
    const enhancedBlack = 'rgba(0, 0, 0, 0.95)';
    // Add subtle text shadow for additional contrast
    return whiteContrast > blackContrast 
      ? `${enhancedWhite}; text-shadow: 0 1px 2px rgba(0,0,0,0.5)`
      : `${enhancedBlack}; text-shadow: 0 1px 2px rgba(255,255,255,0.5)`;
  }

  // Return the color with better contrast
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
};

interface SettingsCardProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  onToggle?: (isOpen: boolean) => void
}

function SettingsCard({ 
  title, 
  defaultOpen = true, 
  children,
  className,
  onToggle 
}: SettingsCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    onToggle?.(newIsOpen)
  }

  return (
    <div className={cn('settings-card', className)}>
      <div
        className="settings-card-header"
        onClick={handleToggle}
      >
        <h2>{title}</h2>
        <svg 
          className={cn(
            'settings-card-chevron',
            isOpen && 'rotate'
          )}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div
        className={cn(
          'settings-card-content',
          isOpen ? 'settings-card-open' : 'settings-card-closed'
        )}
      >
        {children}
      </div>
    </div>
  )
}

// Add these types at the top with other types
interface State {
  colorBands: ColorBand[];
  globalSteps: number;
  globalSaturation: number | null;
  globalCurvePoints: Point[] | null;
  globalSettingsOpen: boolean;
  bandHeight: number;
  bandGap: number;
  showAccessibilityText: boolean;
  stepFormat: StepNameFormat;
}

interface HistoryState {
  past: State[];
  present: State;
  future: State[];
}

// Add action types
type Action = 
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'UPDATE_STATE'; payload: State }
  | { type: 'RESET' };

// Add default state
const defaultState: State = {
  colorBands: [
    {
      id: 1,
      hue: 0,
      saturation: 100,
      lightness: 50,
      steps: 12,
      name: 'Ruby',
      curvePoints: [
        { x: 0, y: 150 },
        { x: 66, y: 100 },
        { x: 133, y: 50 },
        { x: 200, y: 0 }
      ]
    },
    { id: 2, hue: 120, saturation: 100, lightness: 50, steps: 12, name: 'Sapphire', curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
    { id: 3, hue: 240, saturation: 100, lightness: 50, steps: 12, name: 'Emerald', curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
    { id: 4, hue: 60, saturation: 100, lightness: 50, steps: 12, name: 'Ruby', curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
    { id: 5, hue: 180, saturation: 100, lightness: 50, steps: 12, name: 'Sapphire', curvePoints: [
      { x: 0, y: 150 },
      { x: 66, y: 100 },
      { x: 133, y: 50 },
      { x: 200, y: 0 }
    ]},
  ],
  globalSteps: 12,
  globalSaturation: null,
  globalCurvePoints: null,
  globalSettingsOpen: true,
  bandHeight: 120,
  bandGap: 8,
  showAccessibilityText: false,
  stepFormat: 'numeric'
}

// Add reducer function
function historyReducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      
      // Ensure we're not creating duplicate states
      if (JSON.stringify(previous) === JSON.stringify(state.present)) {
        return state;
      }
      
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future]
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      // Ensure we're not creating duplicate states
      if (JSON.stringify(next) === JSON.stringify(state.present)) {
        return {
          past: state.past,
          present: state.present,
          future: newFuture
        };
      }
      
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture
      };
    }
    case 'UPDATE_STATE': {
      // Don't create a new history entry if the state hasn't actually changed
      if (JSON.stringify(action.payload) === JSON.stringify(state.present)) {
        return state;
      }
      
      return {
        past: [...state.past, state.present],
        present: action.payload,
        future: []
      };
    }
    case 'RESET': {
      if (JSON.stringify(state.present) === JSON.stringify(defaultState)) {
        return state;
      }
      
      return {
        past: [],
        present: defaultState,
        future: []
      };
    }
    default:
      return state;
  }
}

// Add this helper function to compare states
const isStateEqual = (state1: State, state2: State): boolean => {
  // Deep comparison of the states
  return JSON.stringify(state1) === JSON.stringify(state2);
};

export default function ColorPaletteGenerator() {
  // Replace existing state with useReducer
  const [{ past, present, future }, dispatch] = useReducer(historyReducer, {
    past: [],
    present: defaultState,
    future: []
  });

  // Extract all managed states from present
  const {
    colorBands,
    globalSteps,
    globalSaturation,
    globalCurvePoints,
    globalSettingsOpen,
    bandHeight,
    bandGap,
    showAccessibilityText,
    stepFormat
  } = present;

  // Add useEffect for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          // Ctrl/Cmd + Shift + Z = Redo
          dispatch({ type: 'REDO' });
        } else {
          // Ctrl/Cmd + Z = Undo
          dispatch({ type: 'UNDO' });
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        // Ctrl/Cmd + Y = Redo
        dispatch({ type: 'REDO' });
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update state management functions
  const updateState = (updates: Partial<State>) => {
    dispatch({
      type: 'UPDATE_STATE',
      payload: { ...present, ...updates }
    });
  };

  // Update existing state setters
  const setColorBands = (newBands: ColorBand[]) => {
    updateState({ colorBands: newBands });
  };

  const setGlobalSteps = (steps: number) => {
    updateState({ globalSteps: steps });
  };

  const setGlobalSaturation = (saturation: number | null) => {
    updateState({ globalSaturation: saturation });
  };

  const setGlobalCurvePoints = (points: Point[] | null) => {
    updateState({ globalCurvePoints: points });
  };

  const setGlobalSettingsOpen = (isOpen: boolean) => {
    updateState({ globalSettingsOpen: isOpen });
  };

  const setBandHeight = (height: number) => {
    updateState({ bandHeight: height });
  };

  const setBandGap = (gap: number) => {
    updateState({ bandGap: gap });
  };

  const setShowAccessibilityText = (show: boolean) => {
    updateState({ showAccessibilityText: show });
  };

  const setStepFormat = (format: StepNameFormat) => {
    updateState({ stepFormat: format });
  };

  const [activeTab, setActiveTab] = useState(1)
  const [bandSettingsOpen, setBandSettingsOpen] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | undefined>(undefined)
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)

  // Update state to handle multiple menus
  const [openMenus, setOpenMenus] = useState<{
    type: MenuType;
    anchor: { x: number; y: number };
  } | null>(null);

  // Add new state for editing name
  const [editingBandId, setEditingBandId] = useState<number | null>(null);
  // Add new state for temporary name editing
  const [editingName, setEditingName] = useState("");

  // Add this utility function for cubic Bézier curve calculation
  const calculateBezierPoint = (t: number, p0: Point, p1: Point, p2: Point, p3: Point) => {
    const oneMinusT = 1 - t
    const oneMinusTSquared = oneMinusT * oneMinusT
    const oneMinusTCubed = oneMinusTSquared * oneMinusT
    const tSquared = t * t
    const tCubed = tSquared * t

    const x = oneMinusTCubed * p0.x +
      3 * oneMinusTSquared * t * p1.x +
      3 * oneMinusT * tSquared * p2.x +
      tCubed * p3.x

    const y = oneMinusTCubed * p0.y +
      3 * oneMinusTSquared * t * p1.y +
      3 * oneMinusT * tSquared * p2.y +
      tCubed * p3.y

    return { x, y }
  }

  const generateColorSteps = (band: ColorBand) => {
    return Array.from({ length: band.steps }, (_, i) => {
      const t = i / (band.steps - 1)
      // Use band's curve points if they've been modified, otherwise use global curve
      const useGlobalCurve = globalCurvePoints && !band.curveModified
      const curvePoints = useGlobalCurve ? globalCurvePoints : band.curvePoints
      const point = calculateBezierPoint(
        t,
        curvePoints[0],
        curvePoints[1],
        curvePoints[2],
        curvePoints[3]
      )
      
      // Keep all existing color calculation logic unchanged
      const normalizedY = point.y / 150
      const curveInfluence = Math.pow(normalizedY, 1.5)
      const lightness = Math.max(5, Math.min(100, (1 - curveInfluence) * 100))
      
      const baseSaturation = globalSaturation !== null ? globalSaturation : band.saturation
      
      let adjustedSaturation = baseSaturation
      if (lightness < 30) {
        const darkBoost = 1 + (0.5 * (1 - lightness / 30))
        adjustedSaturation = Math.min(100, baseSaturation * darkBoost)
      } else if (lightness > 85) {
        const reductionFactor = 1 - ((lightness - 85) / 15) * 0.4
        adjustedSaturation = baseSaturation * reductionFactor
      }
      
      const minLightness = Math.max(5, (adjustedSaturation * 0.1))
      const finalLightness = Math.max(minLightness, lightness)
      
      return `hsl(${band.hue}, ${adjustedSaturation}%, ${finalLightness}%)`
    })
  }

  const addColorBand = () => {
    const newId = Math.max(...colorBands.map(b => b.id)) + 1;
    const newHue = Math.floor(Math.random() * 360);
    const newSaturation = 100;
    
    const newBands = [...colorBands, {
      id: newId,
      hue: newHue,
      saturation: newSaturation,
      lightness: 50,
      steps: globalSteps,
      name: generateColorName(newHue, newSaturation),
      curvePoints: [
        { x: 0, y: 150 },
        { x: 66, y: 100 },
        { x: 133, y: 50 },
        { x: 200, y: 0 }
      ]
    }];
    
    updateState({ colorBands: newBands });
  };

  const removeColorBand = (id: number) => {
    const updatedBands = colorBands.filter(band => band.id !== id);
    updateState({ colorBands: updatedBands });
  };

  const updateBand = (id: number, property: keyof ColorBand, value: number) => {
    const updatedBands = colorBands.map(band => {
      if (band.id === id) {
        const updatedBand = { ...band, [property]: value };
        // Only regenerate name if hue or saturation changes
        if (property === 'hue' || property === 'saturation') {
          updatedBand.name = generateColorName(updatedBand.hue, updatedBand.saturation);
        }
        return updatedBand;
      }
      return band;
    });
    
    // Update state through the history management
    updateState({ colorBands: updatedBands });
  };

  const handleCurveChange = (bandId: number, newPoints: Point[]) => {
    const updatedBands = colorBands.map(band =>
      band.id === bandId
        ? { ...band, curvePoints: newPoints, curveModified: true }
        : band
    );
    updateState({ colorBands: updatedBands });
  };

  const updateGlobalSteps = (steps: number) => {
    const updatedBands = colorBands.map(band => ({
      ...band,
      steps
    }));
    
    updateState({
      globalSteps: steps,
      colorBands: updatedBands
    });
  };

  const resetGlobalSaturation = () => {
    setGlobalSaturation(null)
  };

  const activeBand = colorBands.find(band => band.id === activeTab)

  // Add this helper function at the top of the component
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  const handleCopyFormat = (format: 'scss' | 'css' | 'json') => {
    let content = '';
    
    switch (format) {
      case 'scss':
        content = colorBands.map(band => {
          const colors = generateColorSteps(band);
          const safeName = band.name.toLowerCase().replace(/\s+/g, '-');
          return colors.map((color, index) => {
            return `$${safeName}-${formatStepNumber(index)}: ${color};`;
          }).join('\n');
        }).join('\n\n');
        break;

      case 'css':
        content = `:root {\n${colorBands.map(band => {
          const colors = generateColorSteps(band);
          const safeName = band.name.toLowerCase().replace(/\s+/g, '-');
          return colors.map((color, index) => {
            return `  --${safeName}-${formatStepNumber(index)}: ${color};`;
          }).join('\n');
        }).join('\n')}\n}`;
        break;

      case 'json':
        const jsonObj = colorBands.reduce((acc, band) => {
          const colors = generateColorSteps(band);
          const safeName = band.name.toLowerCase().replace(/\s+/g, '-');
          const bandColors = colors.reduce((colorAcc, color, index) => {
            colorAcc[`${safeName}-${formatStepNumber(index)}`] = color;
            return colorAcc;
          }, {} as Record<string, string>);
          return { ...acc, ...bandColors };
        }, {});
        content = JSON.stringify(jsonObj, null, 2);
        break;
    }

    navigator.clipboard.writeText(content).then(() => {
      handleMenuClose();
      // Show toast notification
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.top = '1rem';
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.background = 'rgba(0, 0, 0, 0.8)';
      el.style.color = 'white';
      el.style.padding = '0.5rem 1rem';
      el.style.borderRadius = '4px';
      el.style.fontSize = '0.875rem';
      el.textContent = `${format.toUpperCase()} copied to clipboard!`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    });
  };

  const handleMenuOpen = (type: MenuType) => (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    const rect = event.currentTarget.getBoundingClientRect();
    setOpenMenus({
      type,
      anchor: {
        x: rect.left,
        y: rect.bottom
      }
    });
  };

  const handleMenuClose = () => {
    setOpenMenus(null);
  };

  // Add this helper function to format step numbers
  const formatStepNumber = (index: number): string => {
    switch (stepFormat) {
      case 'padded':
        return String(index + 1).padStart(3, '0'); // 001, 002, etc.
      case 'hex':
        return (index + 1).toString(16).toUpperCase(); // 1, 2, ..., A, B, etc.
      case 'alphabetic':
        return String.fromCharCode(97 + index).toUpperCase(); // A, B, C, etc.
      case 'numeric':
      default:
        return String(index + 1); // 1, 2, 3, etc.
    }
  }

  // Add this handler for the format menu
  const handleStepFormatChange = (format: StepNameFormat) => {
    setStepFormat(format);
    setIsMenuOpen(false);
  };

  // Separate the name update into temporary state and final save
  const startEditing = (band: ColorBand) => {
    setEditingBandId(band.id);
    setEditingName(band.name);
  };

  const saveBandName = (id: number) => {
    const updatedBands = colorBands.map(band => 
      band.id === id ? { ...band, name: editingName } : band
    );
    updateState({ colorBands: updatedBands });
    setEditingBandId(null);
  };

  const handleImport = (newBands: ColorBand[]) => {
    setColorBands([...colorBands, ...newBands]);
  };

  // Add debounced curve change to reduce history states
  const debouncedCurveChange = useMemo(
    () => debounce(handleCurveChange, 100),
    [colorBands]
  );

  // Update CurveEditor usage to use debounced handler
  const handleCurveUpdate = (bandId: number, newPoints: Point[]) => {
    debouncedCurveChange(bandId, newPoints);
  };

  // Helper function to debounce updates
  function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): T {
    let timeout: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  // Add this to check if current state matches default
  const hasChanges = !isStateEqual(present, defaultState);

  return (
    <div className="color-generator">
      <div className="sidebar">
        <h2>Palette Generator</h2>
        
        <SettingsCard 
          title="Global Settings" 
          defaultOpen={globalSettingsOpen}
          onToggle={(isOpen) => setGlobalSettingsOpen(isOpen)}
        >
          <SettingControl
            label="Global Steps"
            value={globalSteps}
            min={2}
            max={20}
            onChange={setGlobalSteps}
          />
          
          <SettingControl
            label="Global Saturation"
            value={globalSaturation ?? 100}
            min={0}
            max={100}
            unit="%"
            onChange={setGlobalSaturation}
            onReset={() => setGlobalSaturation(null)}
          />

          <div style={{ position: 'relative' }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon="format_list_numbered_24"
              rightIcon="chevron_down_24"
              onClick={handleMenuOpen('stepFormat')}
            >
              Step Format: {stepFormat}
            </Button>
            <Menu
              isOpen={openMenus?.type === 'stepFormat'}
              onClose={handleMenuClose}
              anchorPoint={openMenus?.type === 'stepFormat' ? openMenus.anchor : undefined}
              items={[
                {
                  type: 'default',
                  label: 'Numeric (1, 2, 3)',
                  onClick: () => handleStepFormatChange('numeric'),
                  leftIcon: stepFormat === 'numeric' ? 'check_24' : undefined,
                },
                {
                  type: 'default',
                  label: 'Padded (001, 002, 003)',
                  onClick: () => handleStepFormatChange('padded'),
                  leftIcon: stepFormat === 'padded' ? 'check_24' : undefined,
                },
                {
                  type: 'default',
                  label: 'Hexadecimal (1, 2, ..., A, B)',
                  onClick: () => handleStepFormatChange('hex'),
                  leftIcon: stepFormat === 'hex' ? 'check_24' : undefined,
                },
                {
                  type: 'default',
                  label: 'Alphabetic (A, B, C)',
                  onClick: () => handleStepFormatChange('alphabetic'),
                  leftIcon: stepFormat === 'alphabetic' ? 'check_24' : undefined,
                },
              ]}
            />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Global Lightness Curve</label>
              {globalCurvePoints && (
                <div className="value-controls">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setGlobalCurvePoints(null)}
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>
            <CurveEditor
              width={200}
              height={150}
              points={globalCurvePoints || [
                { x: 0, y: 150 },
                { x: 66, y: 100 },
                { x: 133, y: 50 },
                { x: 200, y: 0 }
              ]}
              onChange={setGlobalCurvePoints}
            />
          </div>
        </SettingsCard>

        <div className="band-tabs">
          {colorBands.map(band => (
            <div
              key={band.id}
              className={`band-tab ${activeTab === band.id ? 'active' : ''}`}
            >
              {editingBandId === band.id ? (
                <input
                  type="text"
                  value={editingName}
                  className="band-name-input"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => saveBandName(band.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveBandName(band.id);
                    } else if (e.key === 'Escape') {
                      setEditingBandId(null);
                    }
                  }}
                />
              ) : (
                <div 
                  className="band-tab-content"
                  onClick={() => setActiveTab(band.id)}
                >
                  <span>{band.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="edit-name-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(band);
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={addColorBand}
          >
            +
          </Button>
        </div>

        {activeBand && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div 
                className="settings-card-toggle"
                onClick={() => setBandSettingsOpen(!bandSettingsOpen)}
              >
                <h2>{activeBand.name} Settings</h2>
                <div className="settings-card-controls">
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => removeColorBand(activeBand.id)}
                  >
                    Remove
                  </Button>
                  <svg 
                    className={cn('settings-card-chevron', bandSettingsOpen && 'rotate')}
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
            <div className={cn(
              'settings-card-content',
              bandSettingsOpen ? 'settings-card-open' : 'settings-card-closed'
            )}>
              <SettingControl
                label="Hue"
                value={activeBand.hue}
                min={0}
                max={360}
                unit="°"
                onChange={(value) => updateBand(activeBand.id, 'hue', value)}
              />

              <SettingControl
                label="Saturation"
                value={activeBand.saturation}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updateBand(activeBand.id, 'saturation', value)}
              />

              <div className="curve-editor-container">
                <label>Lightness Curve</label>
                <CurveEditor
                  width={200}
                  height={150}
                  points={activeBand.curvePoints}
                  onChange={(newPoints) => handleCurveUpdate(activeBand.id, newPoints)}
                />
              </div>
            </div>
          </div>
        )}

        <SettingsCard title="View Settings" defaultOpen={false}>
          <div className="control-group">
            <div className="control-header">
              <label>Show Accessibility Text</label>
              <Button
                variant={showAccessibilityText ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setShowAccessibilityText(!showAccessibilityText)}
              >
                {showAccessibilityText ? 'On' : 'Off'}
              </Button>
            </div>
          </div>
          
          <SettingControl
            label="Band Height"
            value={bandHeight}
            min={60}
            max={240}
            unit="px"
            onChange={setBandHeight}
          />
          
          <SettingControl
            label="Band Gap"
            value={bandGap}
            min={0}
            max={32}
            unit="px"
            onChange={setBandGap}
          />
        </SettingsCard>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-actions">
            <Button
              variant="secondary"
              size="sm"
              leftIcon="undo_24"
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={past.length === 0}
            >
              Undo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon="redo_24"
              onClick={() => dispatch({ type: 'REDO' })}
              disabled={future.length === 0}
            >
              Redo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon="refresh_24"
              onClick={() => dispatch({ type: 'RESET' })}
              disabled={!hasChanges}
              title={hasChanges ? 'Reset to default state' : 'No changes to reset'}
            >
              Reset
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon="upload_24"
              onClick={() => setIsImportModalOpen(true)}
            >
              Import
            </Button>
            <div style={{ position: 'relative' }}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon="content_copy_24"
                rightIcon="chevron_down_24"
                onClick={handleMenuOpen('export')}
              >
                Export
              </Button>
              <Menu
                isOpen={openMenus?.type === 'export'}
                onClose={handleMenuClose}
                anchorPoint={openMenus?.type === 'export' ? openMenus.anchor : undefined}
                items={[
                  {
                    type: 'default',
                    label: 'Copy as SCSS',
                    onClick: () => handleCopyFormat('scss'),
                    leftIcon: 'content_copy_24'
                  },
                  {
                    type: 'default',
                    label: 'Copy as CSS',
                    onClick: () => handleCopyFormat('css'),
                    leftIcon: 'content_copy_24'
                  },
                  {
                    type: 'default',
                    label: 'Copy as JSON',
                    onClick: () => handleCopyFormat('json'),
                    leftIcon: 'content_copy_24'
                  }
                ]}
              />
            </div>
          </div>
        </div>
        
        <div className="color-bands" style={{ gap: `${bandGap}px` }}>
          {colorBands.map(band => (
            <div key={band.id} className="band-container">
              <div 
                className="color-steps"
                style={{ height: `${bandHeight}px` }}
              >
                <div className="band-title">{band.name}</div>
                {generateColorSteps(band).map((color, index) => {
                  const [h, s, l] = color.match(/\d+/g)!.map(Number);
                  const hexColor = hslToHex(h, s, l);
                  
                  return (
                    <div
                      key={index}
                      className="color-step"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        navigator.clipboard.writeText(hexColor);
                        const el = document.createElement('div');
                        el.style.position = 'fixed';
                        el.style.top = '1rem';
                        el.style.left = '50%';
                        el.style.transform = 'translateX(-50%)';
                        el.style.background = 'rgba(0, 0, 0, 0.8)';
                        el.style.color = 'white';
                        el.style.padding = '0.5rem 1rem';
                        el.style.borderRadius = '4px';
                        el.style.fontSize = '0.875rem';
                        el.textContent = `Copied ${hexColor}`;
                        document.body.appendChild(el);
                        setTimeout(() => el.remove(), 2000);
                      }}
                    >
                      {showAccessibilityText && (
                        <div 
                          className="accessibility-text"
                          style={{ 
                            color: getContrastTextColor(h, s, l).split(';')[0],
                            textShadow: getContrastTextColor(h, s, l).includes('text-shadow') 
                              ? getContrastTextColor(h, s, l).split(';')[1].trim()
                              : 'none'
                          }}
                        >
                          {band.name}-{formatStepNumber(index)}
                        </div>
                      )}
                      <div className="color-info">
                        <span>{hexColor}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={(e?: React.MouseEvent) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          setIsImportModalOpen(false);
        }}
        onImport={handleImport}
      />
    </div>
  )
} 