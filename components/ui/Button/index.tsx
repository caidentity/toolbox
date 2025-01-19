// Button.tsx
import React, { forwardRef } from 'react';
import './Button.module.scss';
import styles from './Button.module.scss';
import cn from 'classnames';
import { Icon } from '@glyphkit/glyphkit';

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';
type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  leftIcon?: string;
  rightIcon?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = '',
  disabled,
  size = 'md',
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  icon,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const buttonClasses = cn(
    styles.button,
    styles[`button--${size}`],
    styles[`button--${variant}`],
    {
      [styles['button--full-width']]: fullWidth,
      [styles['button--loading']]: isLoading,
      [styles['button--icon-only']]: (icon || leftIcon || rightIcon) && !children,
    },
    className
  );

  const iconSize = size === 'lg' ? 24 : size === 'sm' || size === 'xs' ? 16 : 20;

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {leftIcon && !isLoading && (
        <Icon 
          name={leftIcon}
          size={iconSize}
          className={styles.buttonIcon}
          color="currentColor"
        />
      )}
      {icon && !isLoading && (
        <Icon 
          name={icon}
          size={iconSize}
          className={styles.buttonIcon}
          color="currentColor"
        />
      )}
      {children}
      {rightIcon && !isLoading && (
        <Icon 
          name={rightIcon}
          size={iconSize}
          className={styles.buttonIcon}
          color='usecurrentcolor'
        />
      )}
      {isLoading && (
        <svg
          className="button__spinner"
          width="20"
          height="20"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            opacity="0.25"
          />
          <path
            fill="currentColor"
            opacity="0.75"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;