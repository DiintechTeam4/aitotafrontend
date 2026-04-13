export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-[#334155] ${className}`}>
      <table className="min-w-full divide-y divide-[#334155] text-left text-sm">{children}</table>
    </div>
  )
}

export function THead({ children }) {
  return <thead className="bg-[#0F172A] text-xs uppercase tracking-wide text-slate-400">{children}</thead>
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-[#334155] bg-[#1E293B]">{children}</tbody>
}

export function TR({ children, className = '' }) {
  return <tr className={className}>{children}</tr>
}

export function TH({ children, className = '' }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>
}

export function TD({ children, className = '', colSpan, ...rest }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 text-[#F1F5F9] ${className}`} {...rest}>
      {children}
    </td>
  )
}
