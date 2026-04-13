import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { botApi } from '../../WhatsAiApp'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Loader } from '../../ui/Loader'

function newNode(i) {
  return { id: `node_${Date.now()}_${i}`, type: 'message', content: '', options: [], nextNodeId: '' }
}

export default function BotFlow() {
  const [triggerKeyword, setTriggerKeyword] = useState('hi')
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data } = await botApi.getFlow()
        if (data.success) { const f = data.data.flow; setTriggerKeyword(f.triggerKeyword || 'hi'); setNodes(f.nodes?.length ? f.nodes : [newNode(0)]) }
      } catch (e) { toast.error(e.response?.data?.message || 'Failed to load flow') } finally { setLoading(false) }
    }
    load()
  }, [])

  function updateNode(idx, patch) { setNodes((prev) => { const n = [...prev]; n[idx] = { ...n[idx], ...patch }; return n }) }
  function addNode() { setNodes((prev) => [...prev, newNode(prev.length)]) }
  function addOption(nodeIdx) {
    setNodes((prev) => { const n = [...prev]; const opts = [...(n[nodeIdx].options || [])]; opts.push({ label: 'Option', value: '1', nextNodeId: '' }); n[nodeIdx] = { ...n[nodeIdx], options: opts }; return n })
  }
  function updateOption(nodeIdx, optIdx, patch) {
    setNodes((prev) => { const n = [...prev]; const opts = [...(n[nodeIdx].options || [])]; opts[optIdx] = { ...opts[optIdx], ...patch }; n[nodeIdx] = { ...n[nodeIdx], options: opts }; return n })
  }

  async function save() {
    setSaving(true)
    try {
      const { data } = await botApi.saveFlow({ triggerKeyword, nodes })
      if (data.success) toast.success('Flow saved'); else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed') } finally { setSaving(false) }
  }

  if (loading) return <Loader label="Loading bot flow…" />

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Chatbot flow</h1>
        <p className="text-sm text-slate-400">Keyword triggers the first node.</p>
      </div>
      <Card><Input label="Trigger keyword" value={triggerKeyword} onChange={(e) => setTriggerKeyword(e.target.value.toLowerCase())} /></Card>
      <div className="space-y-4">
        {nodes.map((node, idx) => (
          <Card key={node.id} title={`Node ${idx + 1}`}>
            <div className="space-y-3">
              <label className="block w-full">
                <span className="mb-1 block text-sm text-slate-300">Type</span>
                <select className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]" value={node.type} onChange={(e) => updateNode(idx, { type: e.target.value })}>
                  <option value="message">message</option>
                  <option value="menu">menu</option>
                  <option value="condition">condition</option>
                </select>
              </label>
              <label className="block w-full">
                <span className="mb-1 block text-sm text-slate-300">Content / body</span>
                <textarea className="w-full min-h-[80px] rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]" value={node.content} onChange={(e) => updateNode(idx, { content: e.target.value })} />
              </label>
              <Input label="Next node id (optional)" value={node.nextNodeId} onChange={(e) => updateNode(idx, { nextNodeId: e.target.value })} />
              {node.type === 'menu' && (
                <div className="rounded-lg border border-[#334155] p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300">Options</span>
                    <Button type="button" className="!py-1 !px-2 text-xs" onClick={() => addOption(idx)}>Add option</Button>
                  </div>
                  {(node.options || []).map((opt, oi) => (
                    <div key={oi} className="grid gap-2 sm:grid-cols-3">
                      <Input label="Label" value={opt.label} onChange={(e) => updateOption(idx, oi, { label: e.target.value })} />
                      <Input label="Value" value={opt.value} onChange={(e) => updateOption(idx, oi, { value: e.target.value })} />
                      <Input label="Next node id" value={opt.nextNodeId} onChange={(e) => updateOption(idx, oi, { nextNodeId: e.target.value })} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={addNode}>Add node</Button>
        <Button type="button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save flow'}</Button>
      </div>
    </div>
  )
}
