// Trishek Green UI components with modern design

import React from 'react';

// Brand color definitions
export const BRAND_COLORS = {
  primary: 'var(--trishek-green, #10B981)', // Fallback to emerald-500
  primaryHover: 'var(--trishek-green-hover, #059669)',
  primaryActive: 'var(--trishek-green-active, #047857)',
  primaryDisabled: 'var(--trishek-green-disabled, #A7F3D0)',
  primaryLight: 'var(--trishek-green-light, #D1FAE5)',
  primaryDark: 'var(--trishek-green-dark, #064E3B)'
};

// CSS variables for brand colors
export const brandCSS = `
  :root {
    --trishek-green: #10B981;
    --trishek-green-hover: #059669;
    --trishek-green-active: #047857;
    --trishek-green-disabled: #A7F3D0;
    --trishek-green-light: #D1FAE5;
    --trishek-green-dark: #064E3B;
  }
`;

// Elevated Card component
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  elevated = true, 
  padding = 'md',
  rounded = '2xl'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  };

  const baseClasses = `
    bg-white border border-gray-200
    ${paddingClasses[padding]}
    ${roundedClasses[rounded]}
    ${elevated ? 'shadow-lg hover:shadow-xl' : 'shadow-sm'}
    transition-all duration-200 ease-in-out
  `;

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};

// Segmented Control component
export interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`inline-flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
            ${value === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// Switch component
export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
          ${checked ? 'bg-green-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {label && (
        <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </div>
  );
};

// Chip/Badge component
export interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
  className = ''
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-green-100 text-green-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`
      inline-flex items-center rounded-full font-medium
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-2 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Progress Pill component
export interface ProgressPillProps {
  current: number;
  total: number;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export const ProgressPill: React.FC<ProgressPillProps> = ({
  current,
  total,
  showPercentage = false,
  animated = true,
  className = ''
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <span className="text-sm font-medium text-gray-700">{current}</span>
        <span className="text-sm text-gray-500">/</span>
        <span className="text-sm font-medium text-gray-700">{total}</span>
      </div>
      
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`
            h-full bg-green-500 rounded-full transition-all duration-300
            ${animated ? 'ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showPercentage && (
        <span className="text-xs text-gray-500">{Math.round(percentage)}%</span>
      )}
    </div>
  );
};

// Skeleton component
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  rounded = true,
  className = ''
}) => {
  return (
    <div
      className={`
        bg-gray-200 animate-pulse
        ${rounded ? 'rounded' : ''}
        ${className}
      `}
      style={{ width, height }}
    />
  );
};

// Shimmer loader component
export const ShimmerLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="h-full w-full bg-gray-200" />
    </div>
  );
};

// Toast Banner component
export interface ToastBannerProps {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({
  type,
  message,
  onClose,
  className = ''
}) => {
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm p-4 border rounded-lg shadow-lg
      ${typeClasses[type]}
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-current hover:opacity-70 transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Sheet/Drawer component
export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  className = ''
}) => {
  if (!isOpen) return null;

  const sideClasses = {
    left: 'left-0 top-0 h-full w-80',
    right: 'right-0 top-0 h-full w-80',
    top: 'top-0 left-0 w-full h-64',
    bottom: 'bottom-0 left-0 w-full h-64'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className={`
        absolute bg-white shadow-xl transition-transform duration-300
        ${sideClasses[side]}
        ${className}
      `}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

