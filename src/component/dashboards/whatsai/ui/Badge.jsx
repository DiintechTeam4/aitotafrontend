const styles = {
  draft: 'bg-slate-600 text-white',
  scheduled: 'bg-[#F59E0B] text-[#0F172A]',
  running: 'bg-[#3B82F6] text-white',
  completed: 'bg-[#34D399] text-[#0F172A]',
  failed: 'bg-[#EF4444] text-white',
  open: 'bg-[#34D399]/20 text-[#34D399]',
  resolved: 'bg-slate-600 text-slate-200',
  pending: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  default: 'bg-[#334155] text-slate-200',
}

export function Badge({ children, variant = 'default' }) {
  const cls = styles[variant] || styles.default
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  )
}
