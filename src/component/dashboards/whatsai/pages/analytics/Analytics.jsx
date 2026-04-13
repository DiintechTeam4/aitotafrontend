import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { analyticsApi } from '../../WhatsAiApp'
import { Card } from '../../ui/Card'
import { Loader } from '../../ui/Loader'
import { MessageStatsChart } from '../../charts/MessageStatsChart'
import { CampaignChart } from '../../charts/CampaignChart'
import { Table, THead, TBody, TR, TH, TD } from '../../ui/Table'
import { Badge } from '../../ui/Badge'

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [o, t, c] = await Promise.all([analyticsApi.overview(), analyticsApi.timeline(), analyticsApi.campaigns()])
        if (o.data.success) setOverview(o.data.data)
        if (t.data.success) setTimeline(t.data.data.timeline || [])
        if (c.data.success) setCampaigns(c.data.data.campaigns || [])
      } catch (e) { toast.error(e.response?.data?.message || 'Failed to load analytics') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <Loader label="Loading analytics…" />

  const cards = [
    { label: 'Total messages', value: overview?.totalMessages ?? 0 },
    { label: 'Delivered %', value: `${overview?.deliveredPercent ?? 0}%` },
    { label: 'Read %', value: `${overview?.readPercent ?? 0}%` },
    { label: 'Failed %', value: `${overview?.failedPercent ?? 0}%` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Analytics</h1>
        <p className="text-sm text-slate-400">Delivery health and campaign comparison</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="!p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold text-[#34D399]">{c.value}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Messages per day (30d)"><MessageStatsChart data={timeline} /></Card>
        <Card title="Campaign performance"><CampaignChart data={campaigns} /></Card>
      </div>
      <Card title="Campaign breakdown">
        <Table>
          <THead><TR><TH>Campaign</TH><TH>Status</TH><TH>Sent</TH><TH>Failed</TH></TR></THead>
          <TBody>
            {campaigns.map((c) => (
              <TR key={c._id}>
                <TD>{c.name}</TD>
                <TD><Badge variant={c.status}>{c.status}</Badge></TD>
                <TD>{c.sent}</TD>
                <TD>{c.failed}</TD>
              </TR>
            ))}
            {!campaigns.length && <TR><TD colSpan={4} className="text-center text-slate-500">No data</TD></TR>}
          </TBody>
        </Table>
      </Card>
    </div>
  )
}
