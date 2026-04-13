import { X } from 'lucide-react'
import { Button } from './Button'

export function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close overlay"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[#334155] bg-[#1E293B] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#334155] px-4 py-3">
          <h2 className="text-lg font-semibold text-[#F1F5F9]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-[#334155] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[#334155] p-4">{footer}</div>}
      </div>
    </div>
  )
}

export function ModalActions({ onCancel, onConfirm, confirmLabel = 'Save', loading }) {
  return (
    <>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" onClick={onConfirm} disabled={loading}>
        {loading ? 'Please wait…' : confirmLabel}
      </Button>
    </>
  )
}
