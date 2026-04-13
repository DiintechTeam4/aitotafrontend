import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { contactsApi } from '../../WhatsAiApp'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Modal, ModalActions } from '../../ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../../ui/Table'
import { Loader } from '../../ui/Loader'

export default function ContactGroups({ onNavigate }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data } = await contactsApi.groups()
      if (data.success) setGroups(data.data.groups || [])
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to load groups') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function createGroup() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const { data } = await contactsApi.createGroup({ name, description })
      if (data.success) { toast.success('Group created'); setOpen(false); setName(''); setDescription(''); load() }
      else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  async function deleteGroup(id) {
    if (!confirm('Delete this group?')) return
    try {
      const { data } = await contactsApi.deleteGroup(id)
      if (data.success) { toast.success('Group deleted'); load() } else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Contact groups</h1>
          <p className="text-sm text-slate-400">
            <button type="button" className="text-[#25D366] hover:underline" onClick={() => onNavigate('contacts')}>← Back to contacts</button>
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>New group</Button>
      </div>
      <Card>
        {loading ? <Loader /> : (
          <Table>
            <THead><TR><TH>Name</TH><TH>Description</TH><TH /></TR></THead>
            <TBody>
              {groups.map((g) => (
                <TR key={g._id}>
                  <TD className="font-medium">{g.name}</TD>
                  <TD className="text-slate-400">{g.description || '—'}</TD>
                  <TD><Button size="sm" variant="danger" onClick={() => deleteGroup(g._id)}>Delete</Button></TD>
                </TR>
              ))}
              {!groups.length && <TR><TD colSpan={3} className="text-center text-slate-500">No groups yet</TD></TR>}
            </TBody>
          </Table>
        )}
      </Card>
      <Modal open={open} title="Create group" onClose={() => setOpen(false)}
        footer={<ModalActions loading={saving} onCancel={() => setOpen(false)} onConfirm={createGroup} />}>
        <div className="space-y-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
