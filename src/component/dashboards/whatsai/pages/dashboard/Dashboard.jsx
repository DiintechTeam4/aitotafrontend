import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { analyticsApi, campaignsApi } from '../../WhatsAiApp'
import { Card } from '../../ui/Card'
import { Loader } from '../../ui/Loader'
import { CampaignChart } from '../../charts/CampaignChart'
import { MessageStatsChart } from '../../charts/MessageStatsChart'
import { Table, THead, TBody, TR, TH, TD } from '../../ui/Table'
import { Badge } from '../../ui/Badge'

export default function Dashboard({ onNavigate }) {
  const [overview, setOverview] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [o, t, c] = await Promise.all([analyticsApi.overview(), analyticsApi.timeline(), campaignsApi.list()])
        if (cancelled) return
        if (o.data.success) setOverview(o.data.data)
        if (t.data.success) setTimeline(t.data.data.timeline || [])
        if (c.data.success) setCampaigns(c.data.data.campaigns || [])
      } catch (e) { if (!cancelled) toast.error(e.response?.data?.message || 'Failed to load dashboard') }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <Loader label="Loading dashboard…" />

  const stats = [
    { label: 'Total messages', value: overview?.totalMessages ?? 0 },
    { label: 'Delivered %', value: `${overview?.deliveredPercent ?? 0}%` },
    { label: 'Read %', value: `${overview?.readPercent ?? 0}%` },
    { label: 'Failed %', value: `${overview?.failedPercent ?? 0}%` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Dashboard</h1>
        <p className="text-sm text-slate-400">Overview of messaging performance</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold text-[#25D366]">{s.value}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Messages over time (30 days)"><MessageStatsChart data={timeline} /></Card>
        <Card title="Campaign performance"><CampaignChart data={campaigns} /></Card>
      </div>
      <Card title="Recent campaigns" action={<button type="button" className="text-sm text-[#25D366] hover:underline" onClick={() => onNavigate('create-campaign')}>New campaign</button>}>
        <Table>
          <THead><TR><TH>Name</TH><TH>Status</TH><TH>Sent</TH><TH>Failed</TH></TR></THead>
          <TBody>
            {campaigns.slice(0, 8).map((c) => (
              <TR key={c._id}>
                <TD>{c.name}</TD>
                <TD><Badge variant={c.status}>{c.status}</Badge></TD>
                <TD>{c.sent}</TD>
                <TD>{c.failed}</TD>
              </TR>
            ))}
            {!campaigns.length && <TR><TD colSpan={4} className="text-center text-slate-500">No campaigns yet</TD></TR>}
          </TBody>
        </Table>
      </Card>
    </div>
  )
}
