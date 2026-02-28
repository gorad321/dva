import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'bg-red-600 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-red-700 transition-colors',
  };
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: '',
    lg: 'text-base px-7 py-3',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${variants[variant]} ${size !== 'md' ? sizes[size] : ''} inline-flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" color={variant === 'outline' ? 'blue' : 'white'} />}
      {children}
    </button>
  );
}
