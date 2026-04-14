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

const emptyForm = { name: '', whatsappTemplateName: '', languageCode: 'en_US', bodyPreview: '' }

export default function Templates() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [previewId, setPreviewId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await templatesApi.list()
      if (data.success) setList(data.data.templates || [])
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!form.name || !form.whatsappTemplateName) { toast.error('Name and WhatsApp template name required'); return }
    const normalized = {
      ...form,
      whatsappTemplateName: form.whatsappTemplateName.trim().toLowerCase().replace(/\s+/g, '_'),
      languageCode: (form.languageCode || 'en_US').trim() || 'en_US',
    }
    setSaving(true)
    try {
      const { data } = await templatesApi.create({ ...normalized, sampleParams: [] })
      if (data.success) { toast.success('Template saved'); setOpen(false); setForm(emptyForm); load() }
      else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed') } finally { setSaving(false) }
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
          <p className="text-sm text-slate-400">Map Meta-approved template names for campaigns</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>Add template</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          {loading ? <Loader /> : (
            <Table>
              <THead><TR><TH>Display name</TH><TH>WA name</TH><TH /></TR></THead>
              <TBody>
                {list.map((t) => (
                  <TR key={t._id}>
                    <TD className="font-medium">{t.name}</TD>
                    <TD className="text-slate-400 text-xs">{t.whatsappTemplateName}</TD>
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
        {preview && <TemplatePreview name={preview.name} bodyPreview={preview.bodyPreview} languageCode={preview.languageCode} whatsappTemplateName={preview.whatsappTemplateName} />}
      </div>
      <Modal open={open} title="New template" onClose={() => setOpen(false)}
        footer={<ModalActions loading={saving} onCancel={() => setOpen(false)} onConfirm={save} />}>
        <div className="space-y-3">
          <Input label="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="WhatsApp template name (Meta)" value={form.whatsappTemplateName} onChange={(e) => setForm({ ...form, whatsappTemplateName: e.target.value })} required />
          <Input label="Language code" value={form.languageCode} onChange={(e) => setForm({ ...form, languageCode: e.target.value })} placeholder="en_US" />
          <label className="block w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">Body preview</span>
            <textarea className="w-full min-h-[100px] rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]" value={form.bodyPreview} onChange={(e) => setForm({ ...form, bodyPreview: e.target.value })} />
          </label>
        </div>
      </Modal>
    </div>
  )
}
