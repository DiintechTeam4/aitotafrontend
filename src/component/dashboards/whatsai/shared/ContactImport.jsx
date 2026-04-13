import { useCallback, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { contactsApi } from '../WhatsAiApp'
import { Button } from '../ui/Button'

export function ContactImport({ onDone }) {
  const [drag, setDrag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const handleFile = useCallback(
    async (file) => {
      if (!file || !file.name.endsWith('.csv')) {
        toast.error('Please choose a CSV file')
        return
      }
      const fd = new FormData()
      fd.append('file', file)
      setUploading(true)
      try {
        const { data } = await contactsApi.importCsv(fd)
        if (data.success) {
          toast.success(data.message || 'Import complete')
          onDone?.()
        } else toast.error(data.message || 'Import failed')
      } catch (e) {
        toast.error(e.response?.data?.message || 'Import failed')
      } finally {
        setUploading(false)
      }
    },
    [onDone]
  )

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        drag ? 'border-[#25D366] bg-[#25D366]/5' : 'border-[#334155] bg-[#0F172A]'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handleFile(f)
      }}
    >
      <Upload className="mx-auto mb-3 h-10 w-10 text-[#25D366]" />
      <p className="text-sm text-slate-300 mb-4">Drag & drop a CSV or click to upload</p>
      <p className="text-xs text-slate-500 mb-4">Columns: name, phone (required), email (optional)</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) handleFile(f)
        }}
      />
      <Button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : 'Select CSV'}
      </Button>
    </div>
  )
}
