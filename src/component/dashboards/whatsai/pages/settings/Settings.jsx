import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '../../WhatsAiApp'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Loader } from '../../ui/Loader'

export default function Settings({ user }) {
  const [phoneId, setPhoneId] = useState('')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.getProfile()
      .then(({ data }) => { if (data.success) setProfile(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function connect(e) {
    e.preventDefault()
    if (!phoneId.trim() || !token.trim()) { toast.error('Phone Number ID and Access Token required'); return }
    setSaving(true)
    try {
      const { data } = await authApi.connectWhatsApp({
        whatsappPhoneNumberId: phoneId.trim(),
        whatsappAccessToken: token.trim(),
      })
      if (data.success) {
        toast.success('WhatsApp connected successfully!')
        setToken('')
        setPhoneId('')
        setProfile(prev => ({ ...prev, waPhoneNumberId: phoneId.trim(), connected: true }))
      } else toast.error(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect')
    } finally { setSaving(false) }
  }

  if (loading) return <Loader label="Loading settings…" />

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Settings</h1>
        <p className="text-sm text-slate-400">Connect Meta WhatsApp Cloud API</p>
      </div>

      <Card title="Business profile">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-[#F1F5F9]">{profile?.name || user?.name || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-[#F1F5F9]">{profile?.email || user?.email || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Business</dt>
            <dd className="text-[#F1F5F9]">{profile?.businessName || '—'}</dd>
          </div>
        </dl>
      </Card>

      <Card title="WhatsApp Cloud API">
        {profile?.connected && profile?.waPhoneNumberId ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[#25D366]"></span>
            <span className="text-xs text-[#34D399]">
              Connected — Phone ID: {profile.waPhoneNumberId}
            </span>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span className="text-xs text-red-400">Not connected</span>
          </div>
        )}

        <p className="text-xs text-slate-500 mb-4">
          Enter your Meta WhatsApp Business Phone Number ID and a permanent access token.
          Webhook URL: <code className="text-[#34D399]">https://app.aitota.com/api/v1/whatsai/webhook</code>
        </p>

        <form onSubmit={connect} className="space-y-4">
          <Input
            label="Phone Number ID"
            value={phoneId}
            onChange={(e) => setPhoneId(e.target.value)}
            placeholder="e.g. 790783224112773"
          />
          <Input
            label="Access Token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="EAAxxxxxxx..."
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : profile?.connected ? 'Update connection' : 'Save connection'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
