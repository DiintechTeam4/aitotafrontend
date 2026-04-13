export function Card({ title, action, children, className = '' }) {
  const hasPadding = !className.includes('p-')
  return (
    <div className={`rounded-xl border border-[#334155] bg-[#1E293B] ${hasPadding ? 'p-5' : ''} ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h3 className="text-base font-semibold text-[#F1F5F9]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
