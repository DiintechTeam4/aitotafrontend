export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[#334155] border-t-[#25D366]"
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}
