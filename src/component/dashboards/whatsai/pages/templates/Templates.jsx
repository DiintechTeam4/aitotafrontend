import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { templatesApi } from '../../WhatsAiApp'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Modal, ModalActions } from '../../ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../../ui/Table'
import { Loader } from '../../ui/Loader'
import { TemplatePreview } from '../../shared/TemplatePreview'

function normalizeMetaTemplateName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, '_')
}

const emptyForm = {
  name: '',
  whatsappTemplateName: '',
  languageCode: 'en',
  bodyPreview: '',
  parameterFormat: 'NAMED',
  sampleParams: [],
}

export default function Templates() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [previewId, setPreviewId] = useState(null)
  const [metaList, setMetaList] = useState([])
  const [metaLoading, setMetaLoading] = useState(false)
  const [savingMetaId, setSavingMetaId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await templatesApi.list()
      if (data.success) setList(data.data.templates || [])
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function loadMetaApproved() {
    setMetaLoading(true)
    try {
      const { data } = await templatesApi.metaApproved()
      if (data.success) {
        setMetaList(data.data.templates || [])
        toast.success(`Loaded ${(data.data.templates || []).length} approved templates from Meta`)
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load Meta templates — connect WhatsApp in Settings.')
    } finally { setMetaLoading(false) }
  }

  function addParamRow() {
    setForm((f) => ({
      ...f,
      sampleParams: [...(f.sampleParams || []), { key: '', value: '' }],
    }))
  }

  function updateParamRow(i, field, value) {
    setForm((f) => {
      const next = [...(f.sampleParams || [])]
      next[i] = { ...next[i], [field]: value }
      return { ...f, sampleParams: next }
    })
  }

  function removeParamRow(i) {
    setForm((f) => ({
      ...f,
      sampleParams: (f.sampleParams || []).filter((_, j) => j !== i),
    }))
  }

  function applyMetaRow(t) {
    setForm((f) => ({
      ...f,
      whatsappTemplateName: t.name,
      languageCode: String(t.language ?? 'en'),
    }))
    toast.success(`Filled: ${t.name} (${t.language})`)
  }

  async function saveFromMetaRow(t) {
    const key = `${t.name}-${t.language}`
    setSavingMetaId(key)
    try {
      const { data } = await templatesApi.saveFromMeta({
        displayName: t.name,
        metaName: t.name,
        language: t.language,
      })
      if (data.success) {
        toast.success(data.data?.existed ? 'Already in database' : 'Saved to database — use in campaigns')
        load()
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed')
    } finally {
      setSavingMetaId(null)
    }
  }

  async function save() {
    if (!form.name || !form.whatsappTemplateName) { toast.error('Name and WhatsApp template name required'); return }
    const normalized = {
      ...form,
      whatsappTemplateName: normalizeMetaTemplateName(form.whatsappTemplateName),
      languageCode: (form.languageCode || 'en').trim().replace(/-/g, '_') || 'en',
      parameterFormat: form.parameterFormat === 'POSITIONAL' ? 'POSITIONAL' : 'NAMED',
      sampleParams: form.sampleParams || [],
    }
    setSaving(true)
    try {
      const { data } = await templatesApi.create({ ...normalized })
      if (data.success) {
        toast.success('Template saved')
        setOpen(false)
        setForm(emptyForm)
        load()
      } else toast.error(data.message)
    } catch (e) {
      const msg = e.response?.data?.message || 'Save failed'
      const hint = e.response?.data?.data?.hint
      toast.error(hint ? `${msg} — ${hint}` : msg)
    } finally { setSaving(false) }
  }

  async function remove(id) {
    if (!confirm('Delete template?')) return
    try {
      const { data } = await templatesApi.remove(id)
      if (data.success) { toast.success('Deleted'); load() } else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed') }
  }

  const preview = list.find((t) => t._id === previewId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Templates</h1>
          <p className="text-sm text-slate-400">
            Map Meta-approved template names. Approval happens in WhatsApp Manager — this app only stores the exact name + language for Cloud API sends.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" disabled={metaLoading} onClick={loadMetaApproved}>
            {metaLoading ? 'Loading Meta…' : 'Sync approved from Meta'}
          </Button>
          <Button type="button" onClick={() => setOpen(true)}>Manual add</Button>
        </div>
      </div>

      {metaList.length > 0 && (
        <Card title="Approved on Meta → save to database (recommended)">
          <p className="text-xs text-slate-500 mb-2">
            Campaigns use DB templates. Click <strong className="text-slate-400">Save to DB</strong> so name + language match Meta exactly (fixes #132001).
          </p>
          <div className="max-h-56 overflow-y-auto text-xs space-y-1">
            {metaList.map((t) => {
              const rowKey = `${t.name}-${t.language}`
              return (
                <div key={rowKey} className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-[#334155]/60">
                  <span className="text-slate-300">{t.name} <span className="text-slate-500">({t.language})</span></span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      disabled={savingMetaId === rowKey}
                      onClick={() => saveFromMetaRow(t)}
                    >
                      {savingMetaId === rowKey ? '…' : 'Save to DB'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(true); applyMetaRow(t) }}>Form</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          {loading ? <Loader /> : (
            <Table>
              <THead><TR><TH>Display</TH><TH>WA name / lang</TH><TH /></TR></THead>
              <TBody>
                {list.map((t) => (
                  <TR key={t._id}>
                    <TD className="font-medium">{t.name}</TD>
                    <TD className="text-slate-400 text-xs">
                      {t.whatsappTemplateName} · {t.languageCode || '—'}
                    </TD>
                    <TD>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setPreviewId(previewId === t._id ? null : t._id)}>Preview</Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => remove(t._id)}>Delete</Button>
                      </div>
                    </TD>
                  </TR>
                ))}
                {!list.length && <TR><TD colSpan={3} className="text-center text-slate-500">No templates</TD></TR>}
              </TBody>
            </Table>
          )}
        </Card>
        {preview && (
          <TemplatePreview
            name={preview.name}
            bodyPreview={preview.bodyPreview}
            languageCode={preview.languageCode}
            whatsappTemplateName={preview.whatsappTemplateName}
          />
        )}
      </div>
      <Modal open={open} title="Manual template (advanced)" onClose={() => setOpen(false)}
        footer={<ModalActions loading={saving} onCancel={() => setOpen(false)} onConfirm={save} />}>
        <div className="space-y-3">
          <Input label="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input
            label="WhatsApp template name (Meta — exact)"
            value={form.whatsappTemplateName}
            onChange={(e) => setForm({ ...form, whatsappTemplateName: e.target.value })}
            required
          />
          <Input label="Language code (exact as Meta, e.g. en or en_US)" value={form.languageCode} onChange={(e) => setForm({ ...form, languageCode: e.target.value })} placeholder="en" />
          <label className="block w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">Body variables format</span>
            <select
              className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]"
              value={form.parameterFormat}
              onChange={(e) => setForm({ ...form, parameterFormat: e.target.value })}
            >
              <option value="NAMED">Named (Meta body variables with names)</option>
              <option value="POSITIONAL">Positional (numbered placeholders in order)</option>
            </select>
          </label>
          <div className="rounded-lg border border-[#334155] bg-[#0F172A] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Sample values for campaigns</span>
              <Button type="button" size="sm" variant="ghost" onClick={addParamRow}>+ Row</Button>
            </div>
            <p className="text-xs text-slate-500">
              Same values are used for every contact in a broadcast. For per-contact text, extend campaigns later.
            </p>
            {(form.sampleParams || []).map((row, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-end">
                {form.parameterFormat !== 'POSITIONAL' && (
                  <Input label="Variable name" value={row.key} onChange={(e) => updateParamRow(i, 'key', e.target.value)} className="flex-1 min-w-[120px]" />
                )}
                <Input label="Value" value={row.value} onChange={(e) => updateParamRow(i, 'value', e.target.value)} className="flex-1 min-w-[120px]" />
                <Button type="button" size="sm" variant="danger" onClick={() => removeParamRow(i)}>Remove</Button>
              </div>
            ))}
          </div>
          <label className="block w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">Body preview</span>
            <textarea className="w-full min-h-[100px] rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]" value={form.bodyPreview} onChange={(e) => setForm({ ...form, bodyPreview: e.target.value })} />
          </label>
        </div>
      </Modal>
    </div>
  )
}
