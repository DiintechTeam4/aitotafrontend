import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { campaignsApi } from '../../WhatsAiApp'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Table, THead, TBody, TR, TH, TD } from '../../ui/Table'
import { Badge } from '../../ui/Badge'
import { Loader } from '../../ui/Loader'

export default function Campaigns({ onNavigate }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [sending, setSending] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await campaignsApi.list()
      if (data.success) setList(data.data.campaigns || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function sendNow(id) {
    if (sending) return
    setSending(id)
    try {
      const { data } = await campaignsApi.send(id)
      if (data.success) toast.success(data.message || 'Sending started')
      else toast.error(data.message)
      load()
    } catch (e) {
      const msg = e.response?.data?.message || 'Send failed'
      const details = e.response?.data?.data
      if (details?.hint) {
        toast.error(`${msg}. ${details.hint}`)
      } else {
        toast.error(msg)
      }
    }
    finally {
      setSending(null)
    }
  }

  async function remove(id) {
    setDeleting(id)
    try {
      const { data } = await campaignsApi.remove(id)
      if (data.success) { toast.success('Deleted'); load() }
      else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Campaigns</h1>
          <p className="text-sm text-slate-400">Broadcasts and scheduled sends</p>
        </div>
        <Button type="button" onClick={() => onNavigate('create-campaign')}>New campaign</Button>
      </div>
      <Card>
        {loading ? <Loader /> : (
          <Table>
            <THead><TR><TH>Name</TH><TH>Status</TH><TH>Total</TH><TH>Sent</TH><TH>Failed</TH><TH>Last error</TH><TH /></TR></THead>
            <TBody>
              {list.map((c) => (
                <TR key={c._id}>
                  <TD className="font-medium">{c.name}</TD>
                  <TD><Badge variant={c.status}>{c.status}</Badge></TD>
                  <TD>{c.totalContacts}</TD>
                  <TD>{c.sent}</TD>
                  <TD>{c.failed}</TD>
                  <TD className="max-w-[360px] text-xs text-red-400 truncate" title={c.lastError || ''}>
                    {c.lastError || '—'}
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-2">
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <Button type="button" size="sm" disabled={sending === c._id} onClick={() => sendNow(c._id)}>
                          {sending === c._id ? 'Sending…' : 'Send'}
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="danger" disabled={deleting === c._id} onClick={() => remove(c._id)}>{deleting === c._id ? '...' : 'Delete'}</Button>
                    </div>
                  </TD>
                </TR>
              ))}
              {!list.length && <TR><TD colSpan={7} className="text-center text-slate-500">No campaigns yet</TD></TR>}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
