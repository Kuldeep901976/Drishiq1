'use client';

import React, { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

// ===== MODULAR UI COMPONENT SYSTEM =====

// ===== 1. LAYOUT COMPONENTS =====

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  fluid?: boolean;
}

export const Container: React.FC<ContainerProps> = ({ children, fluid = false, className = '', ...props }) => (
  <div 
    className={`${fluid ? 'w-full px-4' : 'drishiq-container'} ${className}`} 
    {...props}
  >
    {children}
  </div>
);

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export const Section: React.FC<SectionProps> = ({ children, variant = 'primary', className = '', ...props }) => (
  <section 
    className={`drishiq-section ${variant === 'secondary' ? 'bg-gray-50' : ''} ${className}`} 
    {...props}
  >
    {children}
  </section>
);

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  cols?: 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
}

export const Grid: React.FC<GridProps> = ({ children, cols = 2, gap = 'lg', className = '', ...props }) => (
  <div 
    className={`
      drishiq-grid drishiq-grid-${cols} gap-${gap === 'sm' ? '2' : gap === 'lg' ? '6' : '4'} ${className}
    `}
    {...props}
  >
    {children}
  </div>
);

// ===== 2. CARD COMPONENTS =====

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hover = true, className = '', ...props }) => (
  <div 
    className={`drishiq-card ${hover ? 'hover:shadow-lg hover:-translate-y-1' : ''} ${className}`} 
    {...props}
  >
    {children}
  </div>
);

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...props }) => (
  <div className={`drishiq-card-header ${className}`} {...props}>
    {children}
  </div>
);

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '', ...props }) => (
  <div className={`drishiq-card-body ${className}`} {...props}>
    {children}
  </div>
);

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', ...props }) => (
  <div className={`drishiq-card-footer ${className}`} {...props}>
    {children}
  </div>
);

// ===== 3. BUTTON COMPONENTS =====

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled,
  className = '', 
  ...props 
}) => (
  <button 
    className={`
      drishiq-btn 
      drishiq-btn-${variant}
      ${size === 'sm' ? 'drishiq-btn-sm' : size === 'lg' ? 'drishiq-btn-lg' : ''}
      ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `}
    disabled={loading || disabled}
    {...props}
  >
    {loading && (
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    )}
    {children}
  </button>
);

// ===== 4. FORM COMPONENTS =====

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText, 
  className = '', 
  ...props 
}) => (
  <div className="drishiq-form-group">
    {label && (
      <label className="drishiq-label">
        {label}
      </label>
    )}
    <input 
      className={`
        drishiq-input 
        ${error ? 'border-red-500 focus:border-red-500' : ''}
        ${className}
      `}
      {...props}
    />
    {error && (
      <p className="text-red-500 text-sm mt-1">{error}</p>
    )}
    {helperText && !error && (
      <p className="text-gray-500 text-sm mt-1">{helperText}</p>
    )}
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ 
  label, 
  error, 
  helperText, 
  className = '', 
  ...props 
}) => (
  <div className="drishiq-form-group">
    {label && (
      <label className="drishiq-label">
        {label}
      </label>
    )}
    <textarea 
      className={`
        drishiq-input drishiq-textarea
        ${error ? 'border-red-500 focus:border-red-500' : ''}
        ${className}
      `}
      {...props}
    />
    {error && (
      <p className="text-red-500 text-sm mt-1">{error}</p>
    )}
    {helperText && !error && (
      <p className="text-gray-500 text-sm mt-1">{helperText}</p>
    )}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  error, 
  helperText, 
  options, 
  className = '', 
  ...props 
}) => (
  <div className="drishiq-form-group">
    {label && (
      <label className="drishiq-label">
        {label}
      </label>
    )}
    <select 
      className={`
        drishiq-input drishiq-select
        ${error ? 'border-red-500 focus:border-red-500' : ''}
        ${className}
      `}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && (
      <p className="text-red-500 text-sm mt-1">{error}</p>
    )}
    {helperText && !error && (
      <p className="text-gray-500 text-sm mt-1">{helperText}</p>
    )}
  </div>
);

// ===== 5. STATUS COMPONENTS =====

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'info', 
  className = '', 
  ...props 
}) => (
  <span 
    className={`drishiq-badge drishiq-badge-${variant} ${className}`} 
    {...props}
  >
    {children}
  </span>
);

// ===== 6. TABLE COMPONENTS =====

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export const Table: React.FC<TableProps> = ({ children, className = '', ...props }) => (
  <table className={`drishiq-table ${className}`} {...props}>
    {children}
  </table>
);

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '', ...props }) => (
  <thead className={className} {...props}>
    {children}
  </thead>
);

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '', ...props }) => (
  <tbody className={className} {...props}>
    {children}
  </tbody>
);

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', ...props }) => (
  <tr className={className} {...props}>
    {children}
  </tr>
);

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  header?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  header = false, 
  className = '', 
  ...props 
}) => {
  const Component = header ? 'th' : 'td';
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

// ===== 7. NAVIGATION COMPONENTS =====

interface TabProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export const Tab: React.FC<TabProps> = ({ 
  children, 
  active = false, 
  onClick, 
  className = '', 
  ...props 
}) => (
  <button 
    className={`drishiq-nav-tab ${active ? 'active' : ''} ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

interface TabGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const TabGroup: React.FC<TabGroupProps> = ({ children, className = '', ...props }) => (
  <div className={`drishiq-nav-tabs ${className}`} {...props}>
    {children}
  </div>
);

// ===== 8. MODAL COMPONENTS =====

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ 
  children, 
  isOpen, 
  onClose, 
  className = '', 
  ...props 
}) => {
  if (!isOpen) return null;

  return (
    <div className="drishiq-modal-overlay" onClick={onClose}>
      <div 
        className={`drishiq-modal ${className}`} 
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  onClose?: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ 
  children, 
  onClose, 
  className = '', 
  ...props 
}) => (
  <div className={`drishiq-modal-header ${className}`} {...props}>
    <div>{children}</div>
    {onClose && (
      <button 
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '', ...props }) => (
  <div className={`drishiq-modal-body ${className}`} {...props}>
    {children}
  </div>
);

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '', ...props }) => (
  <div className={`drishiq-modal-footer ${className}`} {...props}>
    {children}
  </div>
);

// ===== 9. UTILITY COMPONENTS =====

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  ...props 
}) => (
  <div 
    className={`
      animate-spin rounded-full border-2 border-gray-300 border-t-current
      ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'}
      ${className}
    `}
    {...props}
  />
);

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'info', 
  onClose, 
  className = '', 
  ...props 
}) => {
  const variantClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div 
      className={`
        border rounded-lg p-4 ${variantClasses[variant]} ${className}
      `}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div>{children}</div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ===== 10. EXPORT ALL COMPONENTS =====
// All components are exported individually above
