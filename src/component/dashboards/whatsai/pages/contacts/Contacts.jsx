import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { contactsApi } from '../../WhatsAiApp'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Modal, ModalActions } from '../../ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../../ui/Table'
import { Loader } from '../../ui/Loader'
import { ContactImport } from '../../shared/ContactImport'

export default function Contacts({ onNavigate }) {
  const [contacts, setContacts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [groups, setGroups] = useState([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignContact, setAssignContact] = useState(null)
  const [selectedGroups, setSelectedGroups] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await contactsApi.list({ page: pagination.page, limit: pagination.limit, search })
      if (data.success) {
        setContacts(data.data.contacts || [])
        if (data.data.pagination) setPagination(data.data.pagination)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load contacts')
    } finally { setLoading(false) }
  }, [pagination.page, pagination.limit, search])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  useEffect(() => {
    contactsApi.groups().then(({ data }) => { if (data.success) setGroups(data.data.groups || []) }).catch(() => {})
  }, [])

  async function toggleOptOut(c) {
    try {
      const { data } = await contactsApi.update(c._id, { optedOut: !c.optedOut })
      if (data.success) { toast.success('Updated'); load() } else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Update failed') }
  }

  async function removeContact(id) {
    if (!confirm('Delete this contact?')) return
    try {
      const { data } = await contactsApi.remove(id)
      if (data.success) { toast.success('Deleted'); load() } else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed') }
  }

  function openAssign(c) {
    setAssignContact(c)
    setSelectedGroups((c.group || []).map((g) => (typeof g === 'object' ? g._id : g)).filter(Boolean))
    // Refresh groups list every time modal opens
    contactsApi.groups().then(({ data }) => { if (data.success) setGroups(data.data.groups || []) }).catch(() => {})
    setAssignOpen(true)
  }

  async function saveAssign() {
    if (!assignContact) return
    setSaving(true)
    try {
      const { data } = await contactsApi.update(assignContact._id, { group: selectedGroups })
      if (data.success) { toast.success('Groups updated'); setAssignOpen(false); load() } else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Update failed') } finally { setSaving(false) }
  }

  async function addContact() {
    setSaving(true)
    try {
      const phone = form.phone.replace(/\D/g, '')
      const { data } = await contactsApi.create({ ...form, phone: phone.startsWith('91') ? phone : `91${phone}` })
      if (data.success) { toast.success('Contact added'); setAddOpen(false); setForm({ name: '', phone: '', email: '' }); load() }
      else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to add') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Contacts</h1>
          <p className="text-sm text-slate-400">
            Manage subscribers ·{' '}
            <button type="button" className="text-[#25D366] hover:underline" onClick={() => onNavigate('contact-groups')}>Groups</button>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => setImportOpen(true)}>Import CSV</Button>
          <Button type="button" onClick={() => setAddOpen(true)}>Add contact</Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 max-w-md">
          <Input placeholder="Search name, phone, email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loading ? <Loader /> : (
          <Table>
            <THead><TR><TH>Name</TH><TH>Phone</TH><TH>Email</TH><TH>Groups</TH><TH>Opt-out</TH><TH>Assign</TH><TH /></TR></THead>
            <TBody>
              {contacts.map((c) => (
                <TR key={c._id}>
                  <TD>{c.name}</TD>
                  <TD>{c.phone}</TD>
                  <TD>{c.email || '—'}</TD>
                  <TD>{(c.group || []).map((g) => (typeof g === 'object' ? g.name : '')).filter(Boolean).join(', ') || '—'}</TD>
                  <TD>
                    <button type="button" onClick={() => toggleOptOut(c)} className={`text-xs font-medium ${c.optedOut ? 'text-[#EF4444]' : 'text-[#34D399]'}`}>
                      {c.optedOut ? 'Yes' : 'No'}
                    </button>
                  </TD>
                  <TD><Button type="button" size="sm" variant="ghost" onClick={() => openAssign(c)}>Assign</Button></TD>
                  <TD><Button type="button" size="sm" variant="danger" onClick={() => removeContact(c._id)}>Delete</Button></TD>
                </TR>
              ))}
              {!contacts.length && <TR><TD colSpan={7} className="text-center text-slate-500">No contacts</TD></TR>}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal open={importOpen} title="Import contacts" onClose={() => setImportOpen(false)}
        footer={<ModalActions onCancel={() => setImportOpen(false)} onConfirm={() => setImportOpen(false)} confirmLabel="Done" />}>
        <ContactImport onDone={() => { setImportOpen(false); load() }} />
      </Modal>

      <Modal open={assignOpen} title="Assign groups" onClose={() => setAssignOpen(false)}
        footer={<ModalActions loading={saving} onCancel={() => setAssignOpen(false)} onConfirm={saveAssign} />}>
        <p className="text-sm text-slate-400 mb-3">Select groups for <strong className="text-[#F1F5F9]">{assignContact?.name}</strong>.</p>
        {groups.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 mb-2">No groups found.</p>
            <button type="button" className="text-xs text-[#25D366] hover:underline" onClick={() => { setAssignOpen(false); onNavigate('contact-groups') }}>Create a group first →</button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-2">Hold Ctrl/Cmd to select multiple.</p>
            <select multiple className="w-full min-h-[140px] rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F1F5F9]"
              value={selectedGroups.map(String)} onChange={(e) => setSelectedGroups([...e.target.selectedOptions].map((o) => o.value))}>
              {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
          </>
        )}
      </Modal>

      <Modal open={addOpen} title="Add contact" onClose={() => setAddOpen(false)}
        footer={<ModalActions loading={saving} onCancel={() => setAddOpen(false)} onConfirm={addContact} />}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
