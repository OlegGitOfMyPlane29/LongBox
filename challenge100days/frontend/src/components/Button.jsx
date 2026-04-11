export default function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  const variantClasses = {
    primary: 'bg-block-success hover:bg-green-700 text-block-text',
    danger: 'bg-block-fail hover:bg-red-700 text-block-text',
    neutral: 'bg-block-muted hover:bg-zinc-600 text-block-text',
    accent: 'bg-block-accent hover:bg-amber-700 text-block-text',
  }

  return (
    <button
      type={type}
      className={`rounded-none border-4 border-black px-4 py-2 font-bold uppercase tracking-wide shadow-block transition ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
