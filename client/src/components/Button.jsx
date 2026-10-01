// Disabled with a "Please wait..." label while loading, so users cannot submit twice
const Button = ({ children, loading = false, variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
  }

  return (
    <button
      disabled={loading || props.disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  )
}

export default Button
