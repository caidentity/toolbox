// Button.tsx
import React, { forwardRef } from 'react';
import './button.scss';

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = '',
  disabled,
  size = 'md',
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  ...props
}, ref) => {
  const buttonClasses = [
    'button',
    `button--${size}`,
    `button--${variant}`,
    isLoading && 'button--loading',
    fullWidth && 'button--full-width',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
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