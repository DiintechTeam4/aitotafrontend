export function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
  size,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 disabled:pointer-events-none'
  const sizes = {
    sm: 'px-2 py-1',
    md: 'px-4 py-2',
  }
  const variants = {
    primary: 'bg-[#25D366] text-[#0F172A] hover:opacity-90',
    secondary: 'bg-[#128C7E] text-white hover:opacity-90',
    ghost: 'bg-transparent text-[#F1F5F9] border border-[#334155] hover:bg-[#1E293B]',
    danger: 'bg-[#EF4444] text-white hover:opacity-90',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
