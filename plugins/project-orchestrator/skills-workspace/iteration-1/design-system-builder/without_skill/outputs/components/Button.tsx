'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/* -------------------------------------------------------------------------- */
/*  Button Variants (CVA)                                                      */
/* -------------------------------------------------------------------------- */

const buttonVariants = cva(
  /* Base styles shared by every button */
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-md font-medium',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'whitespace-nowrap select-none',
  ],
  {
    variants: {
      /** Visual style of the button */
      variant: {
        primary: [
          'bg-primary-600 text-white',
          'hover:bg-primary-700',
          'active:bg-primary-800',
          'dark:bg-primary-500 dark:hover:bg-primary-600 dark:active:bg-primary-700',
        ],
        secondary: [
          'bg-gray-100 text-gray-900',
          'border border-gray-300',
          'hover:bg-gray-200',
          'active:bg-gray-300',
          'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
          'dark:hover:bg-gray-700 dark:active:bg-gray-600',
        ],
        ghost: [
          'bg-transparent text-gray-700',
          'hover:bg-gray-100',
          'active:bg-gray-200',
          'dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700',
        ],
        danger: [
          'bg-danger-600 text-white',
          'hover:bg-danger-700',
          'active:bg-danger-800',
          'dark:bg-danger-500 dark:hover:bg-danger-600 dark:active:bg-danger-700',
        ],
      },

      /** Size of the button */
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Optional icon rendered before the label */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered after the label */
  rightIcon?: React.ReactNode;
  /** Show a loading spinner and disable interaction */
  isLoading?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      leftIcon,
      rightIcon,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          leftIcon
        )}

        {children}

        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
