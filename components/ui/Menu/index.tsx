import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';
import styles from './Menu.module.scss';
import { Icon } from '@glyphkit/glyphkit';
import { cn } from '@/lib/utils';

export type MenuItemType = 'default' | 'button' | 'radio' | 'section' | 'custom';

export interface BaseMenuItemProps {
  type?: MenuItemType;
  disabled?: boolean;
  className?: string;
}

export interface DefaultMenuItemProps extends BaseMenuItemProps {
  type?: 'default';
  label?: string;
  leftIcon?: string;
  rightIcon?: string;
  onClick?: () => void;
}

export interface ButtonMenuItemProps extends BaseMenuItemProps {
  type: 'button';
  children: ReactNode;
  onClick?: () => void;
}

export interface RadioMenuItemProps extends BaseMenuItemProps {
  type: 'radio';
  label: string;
  value: string;
  groupName: string;
  checked?: boolean;
  onChange?: (value: string) => void;
}

export interface SectionMenuItemProps extends BaseMenuItemProps {
  type: 'section';
  title: string;
  items: MenuItemProps[];
}

export interface CustomMenuItemProps extends BaseMenuItemProps {
  type: 'custom';
  content: ReactNode;
}

export type MenuItemProps = 
  | DefaultMenuItemProps 
  | ButtonMenuItemProps 
  | RadioMenuItemProps 
  | SectionMenuItemProps 
  | CustomMenuItemProps;

interface MenuProps {
  items: MenuItemProps[];
  isOpen: boolean;
  onClose: () => void;
  anchorPoint?: { x: number; y: number };
  className?: string;
}

export const Menu = ({ items, isOpen, onClose, anchorPoint, className }: MenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ 
    x: number; 
    y: number;
    position: 'bottom' | 'top' | 'left' | 'right';
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !anchorPoint) {
      setMenuPosition(null);
      return;
    }

    // Set initial position
    const initialPosition = {
      x: anchorPoint.x,
      y: anchorPoint.y,
      position: 'bottom' as const
    };
    setMenuPosition(initialPosition);

    // Adjust position after render
    const timeoutId = setTimeout(() => {
      const menu = menuRef.current;
      if (!menu) return;

      const OFFSET = 8; // Spacing between anchor and menu
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate available space in each direction
      const spaceBelow = viewportHeight - anchorPoint.y;
      const spaceAbove = anchorPoint.y;
      const spaceRight = viewportWidth - anchorPoint.x;
      const spaceLeft = anchorPoint.x;

      let x = anchorPoint.x;
      let y = anchorPoint.y;
      let position: 'bottom' | 'top' | 'left' | 'right' = 'bottom';

      // Try to position below first (default)
      if (spaceBelow >= menuRect.height + OFFSET) {
        y = anchorPoint.y + OFFSET;
        position = 'bottom';
      }
      // Try above if not enough space below
      else if (spaceAbove >= menuRect.height + OFFSET) {
        y = anchorPoint.y - menuRect.height - OFFSET;
        position = 'top';
      }
      // Try right if neither above nor below works
      else if (spaceRight >= menuRect.width + OFFSET) {
        x = anchorPoint.x + OFFSET;
        y = Math.min(
          Math.max(OFFSET, anchorPoint.y),
          viewportHeight - menuRect.height - OFFSET
        );
        position = 'right';
      }
      // Last resort: try left
      else {
        x = anchorPoint.x - menuRect.width - OFFSET;
        y = Math.min(
          Math.max(OFFSET, anchorPoint.y),
          viewportHeight - menuRect.height - OFFSET
        );
        position = 'left';
      }

      // Ensure menu stays within viewport horizontally
      if (position === 'bottom' || position === 'top') {
        if (x + menuRect.width > viewportWidth) {
          x = viewportWidth - menuRect.width - OFFSET;
        }
        x = Math.max(OFFSET, x);
      }

      setMenuPosition({ x, y, position });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isOpen, anchorPoint]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!anchorPoint || !menuPosition) return null;

  const menuStyle = {
    position: 'fixed',
    left: `${menuPosition.x}px`,
    top: `${menuPosition.y}px`,
    transformOrigin: menuPosition.y > anchorPoint.y ? 'top' : 'bottom',
  } as const;

  const renderMenuItem = (item: MenuItemProps, index: number) => {
    switch (item.type) {
      case 'button':
        return (
          <ButtonMenuItem 
            key={index} 
            {...item} 
            onClick={() => {
              item.onClick?.();
              onClose();
            }}
          />
        );
      
      case 'radio':
        return (
          <RadioMenuItem 
            key={index} 
            {...item} 
            onChange={(value) => {
              item.onChange?.(value);
              onClose();
            }}
          />
        );
      
      case 'section':
        return (
          <SectionMenuItem 
            key={index} 
            {...item} 
            onClose={onClose}
          />
        );
      
      case 'custom':
        return (
          <CustomMenuItem 
            key={index} 
            {...item}
          />
        );
      
      default:
        return (
          <DefaultMenuItem 
            key={index} 
            {...item as DefaultMenuItemProps} 
            onClick={() => {
              (item as DefaultMenuItemProps).onClick?.();
              onClose();
            }}
          />
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && anchorPoint && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={menuRef}
            className={cn(styles.menu, className)}
            data-position={menuPosition?.position || 'bottom'}
            style={{
              position: 'fixed',
              left: `${menuPosition?.x ?? anchorPoint.x}px`,
              top: `${menuPosition?.y ?? anchorPoint.y}px`,
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {items.map((item, index) => renderMenuItem(item, index))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const DefaultMenuItem = ({ 
  label, 
  leftIcon, 
  rightIcon, 
  onClick, 
  disabled,
  className 
}: DefaultMenuItemProps) => (
  <div 
    className={cn(styles.menuItem, disabled && styles.disabled, className)} 
    onClick={disabled ? undefined : onClick}
  >
    {leftIcon && <Icon name={leftIcon} size={18} className={styles.leftIcon} />}
    {label && <span className={styles.label}>{label}</span>}
    {rightIcon && <Icon name={rightIcon} size={18} className={styles.rightIcon} />}
  </div>
);

const ButtonMenuItem = ({ 
  children, 
  onClick, 
  disabled,
  className 
}: ButtonMenuItemProps) => (
  <button 
    className={cn(styles.menuButton, disabled && styles.disabled, className)}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const RadioMenuItem = ({ 
  label, 
  value, 
  groupName, 
  checked, 
  onChange,
  disabled,
  className 
}: RadioMenuItemProps) => (
  <label className={cn(styles.menuRadio, disabled && styles.disabled, className)}>
    <input
      type="radio"
      name={groupName}
      value={value}
      checked={checked}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
    />
    <span className={styles.radioLabel}>{label}</span>
  </label>
);

const SectionMenuItem = ({ 
  title, 
  items,
  onClose,
  className 
}: SectionMenuItemProps & { onClose: () => void }) => (
  <div className={cn(styles.menuSection, className)}>
    <div className={styles.sectionTitle}>{title}</div>
    <div className={styles.sectionItems}>
      {items.map((item, index) => (
        <DefaultMenuItem
          key={index}
          {...item as DefaultMenuItemProps}
          onClick={() => {
            (item as DefaultMenuItemProps).onClick?.();
            onClose();
          }}
        />
      ))}
    </div>
  </div>
);

const CustomMenuItem = ({ 
  content,
  className 
}: CustomMenuItemProps) => (
  <div className={cn(styles.menuCustom, className)}>
    {content}
  </div>
);
