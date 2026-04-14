import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { campaignsApi, contactsApi, templatesApi } from '../../WhatsAiApp'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { TemplatePreview } from '../../shared/TemplatePreview'

export default function CreateCampaign({ onNavigate }) {
  const [groups, setGroups] = useState([])
  const [templates, setTemplates] = useState([])
  const [name, setName] = useState('')
  const [targetGroup, setTargetGroup] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedTemplate = templates.find((t) => t._id === templateId)

  useEffect(() => {
    async function load() {
      try {
        const [g, t] = await Promise.all([contactsApi.groups(), templatesApi.list()])
        if (g.data.success) setGroups(g.data.data.groups || [])
        if (t.data.success) {
          const allTemplates = t.data.data.templates || []
          const validTemplates = allTemplates.filter(
            (tpl) => String(tpl?.whatsappTemplateName || '').trim().length > 0
          )
          setTemplates(validTemplates)
        }
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load form data')
      }
    }
    load()
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!name || !targetGroup || !templateId) { toast.error('Fill name, group and template'); return }
    setLoading(true)
    try {
      const body = { name, targetGroup, template: templateId, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined }
      const { data } = await campaignsApi.create(body)
      if (data.success) {
        toast.success('Campaign created')
        const c = data.data.campaign
        if (!scheduledAt && c.status === 'draft') {
          try {
            const sendRes = await campaignsApi.send(c._id)
            if (!sendRes?.data?.success) {
              toast.error(sendRes?.data?.message || 'Campaign send failed')
            }
          } catch (sendErr) {
            toast.error(sendErr.response?.data?.message || 'Campaign send failed')
          }
        }
        onNavigate('campaigns')
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Create campaign</h1>
        <p className="text-sm text-slate-400">Target a group with an approved WhatsApp template</p>
      </div>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="block w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">Contact group</span>
            <select className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]" value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} required>
              <option value="">Select group</option>
              {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
          </label>
          <label className="block w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">Template</span>
            <select className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]" value={templateId} onChange={(e) => setTemplateId(e.target.value)} required>
              <option value="">Select template</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.whatsappTemplateName} | {t.languageCode || 'en_US'})
                </option>
              ))}
            </select>
          </label>
          <Input label="Schedule (optional)" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Saving…' : scheduledAt ? 'Schedule' : 'Create & send now'}</Button>
            <Button type="button" variant="ghost" onClick={() => onNavigate('campaigns')}>Cancel</Button>
          </div>
        </form>
      </Card>
      {selectedTemplate && (
        <TemplatePreview name={selectedTemplate.name} bodyPreview={selectedTemplate.bodyPreview} languageCode={selectedTemplate.languageCode} whatsappTemplateName={selectedTemplate.whatsappTemplateName} />
      )}
    </div>
  )
}
