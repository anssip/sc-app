import React from 'react'

interface ToolbarButtonProps {
  onClick?: () => void
  disabled?: boolean
  title?: string
  active?: boolean
  variant?: 'default' | 'danger'
  className?: string
  children: React.ReactNode
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  disabled = false,
  title,
  active = false,
  variant = 'default',
  className = '',
  children,
}) => {
  const baseClasses = 'flex items-center justify-center px-2 py-1 text-sm border rounded transition-colors h-[28px]'
  
  const variantClasses = {
    default: active 
      ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700 hover:border-blue-600' 
      : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700',
    danger: 'bg-gray-800 border-gray-700 text-white hover:bg-red-900 hover:border-red-700',
  }
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  )
}

interface ToolbarDropdownButtonProps {
  disabled?: boolean
  title?: string
  active?: boolean
  className?: string
  children: React.ReactNode
}

export const ToolbarDropdownButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarDropdownButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ disabled = false, title, active = false, className = '', children, ...props }, ref) => {
  const baseClasses = 'flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-white transition-colors h-[28px]'
  const activeClasses = active ? 'bg-gray-700 text-blue-400' : ''
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return (
    <button
      ref={ref}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${activeClasses} ${disabledClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

ToolbarDropdownButton.displayName = 'ToolbarDropdownButton'