export function Input({ label, id, className = '', error, ...rest }) {
  const inputId = id || rest.name
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1 block text-sm font-medium text-slate-300">{label}</span>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9] placeholder:text-slate-500 outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] ${className}`}
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-[#EF4444]">{error}</span>}
    </label>
  )
}
