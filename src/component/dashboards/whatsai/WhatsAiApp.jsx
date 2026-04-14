import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Loader } from './ui/Loader'

import Dashboard from './pages/dashboard/Dashboard'
import Campaigns from './pages/campaigns/Campaigns'
import CreateCampaign from './pages/campaigns/CreateCampaign'
import Contacts from './pages/contacts/Contacts'
import ContactGroups from './pages/contacts/ContactGroups'
import Inbox from './pages/inbox/Inbox'
import Templates from './pages/templates/Templates'
import Analytics from './pages/analytics/Analytics'
import BotFlow from './pages/chatbot/BotFlow'
import Settings from './pages/settings/Settings'

import {
  LayoutDashboard, Megaphone, Users, MessageCircle,
  Bot, FileText, BarChart3, Settings as SettingsIcon,
} from 'lucide-react'

const WHATSAI_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '') + '/api/v1/whatsai'

// Axios instance using existing client session token
export const waApi = axios.create({ baseURL: WHATSAI_BASE })
waApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('clienttoken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const contactsApi = {
  list: (params) => waApi.get('/contacts', { params }),
  create: (body) => waApi.post('/contacts', body),
  update: (id, body) => waApi.patch(`/contacts/${id}`, body),
  remove: (id) => waApi.delete(`/contacts/${id}`),
  importCsv: (fd) => waApi.post('/contacts/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  groups: () => waApi.get('/contacts/groups'),
  createGroup: (body) => waApi.post('/contacts/groups', body),
  deleteGroup: (id) => waApi.delete(`/contacts/groups/${id}`),
}
export const templatesApi = {
  list: () => waApi.get('/templates'),
  metaApproved: () => waApi.get('/templates/meta-approved'),
  saveFromMeta: (body) => waApi.post('/templates/from-meta', body),
  get: (id) => waApi.get(`/templates/${id}`),
  create: (body) => waApi.post('/templates', body),
  update: (id, body) => waApi.patch(`/templates/${id}`, body),
  remove: (id) => waApi.delete(`/templates/${id}`),
}
export const campaignsApi = {
  list: () => waApi.get('/campaigns'),
  get: (id) => waApi.get(`/campaigns/${id}`),
  create: (body) => waApi.post('/campaigns', body),
  send: (id) => waApi.post(`/campaigns/${id}/send`),
  remove: (id) => waApi.delete(`/campaigns/${id}`),
}
export const analyticsApi = {
  overview: () => waApi.get('/analytics/overview'),
  campaigns: () => waApi.get('/analytics/campaigns'),
  timeline: () => waApi.get('/analytics/timeline'),
}
export const inboxApi = {
  conversations: () => waApi.get('/inbox/conversations'),
  messages: (id) => waApi.get(`/inbox/conversations/${id}/messages`),
  reply: (id, body) => waApi.post(`/inbox/conversations/${id}/reply`, body),
  assign: (id, body) => waApi.patch(`/inbox/conversations/${id}/assign`, body),
}
export const botApi = {
  getFlow: () => waApi.get('/bot/flow'),
  saveFlow: (body) => waApi.post('/bot/flow', body),
}
export const authApi = {
  connectWhatsApp: (body) => waApi.post('/connect', body),
  getProfile: () => waApi.get('/profile'),
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'contacts', label: 'Contacts', icon: Users },
  { key: 'inbox', label: 'Inbox', icon: MessageCircle },
  { key: 'chatbot', label: 'Chatbot', icon: Bot },
  { key: 'templates', label: 'Templates', icon: FileText },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function WhatsAiApp() {
  const [activePage, setActivePage] = useState('dashboard')

  // Get client info from existing session
  const clientData = (() => {
    try { return JSON.parse(sessionStorage.getItem('clientData') || '{}') } catch { return {} }
  })()

  function renderPage() {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />
      case 'campaigns': return <Campaigns onNavigate={setActivePage} />
      case 'create-campaign': return <CreateCampaign onNavigate={setActivePage} />
      case 'contacts': return <Contacts onNavigate={setActivePage} />
      case 'contact-groups': return <ContactGroups onNavigate={setActivePage} />
      case 'inbox': return <Inbox />
      case 'templates': return <Templates />
      case 'analytics': return <Analytics />
      case 'chatbot': return <BotFlow />
      case 'settings': return <Settings user={clientData} />
      default: return <Dashboard onNavigate={setActivePage} />
    }
  }

  const activeNav = ['create-campaign', 'contact-groups'].includes(activePage)
    ? activePage === 'create-campaign' ? 'campaigns' : 'contacts'
    : activePage

  return (
    <div className="flex min-h-[600px] bg-[#0F172A] rounded-xl overflow-hidden border border-[#334155]">
      {/* Sidebar */}
      <aside className="w-52 flex flex-col border-r border-[#334155] bg-[#0F172A] shrink-0">
        <div className="flex h-14 items-center gap-2 border-b border-[#334155] px-4">
          <div className="h-8 w-8 rounded-lg bg-[#25D366] flex items-center justify-center text-[#0F172A] font-bold text-xs">WA</div>
          <div>
            <div className="text-sm font-semibold text-[#F1F5F9]">WhatsAi</div>
            <div className="text-xs text-slate-500">AI WhatsApp Agent</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2 overflow-y-auto">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setActivePage(key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left w-full ${
                activeNav === key ? 'bg-[#25D366]/15 text-[#25D366]' : 'text-slate-300 hover:bg-[#334155]/50 hover:text-white'
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#334155]">
          <div className="px-2 py-1 text-xs text-slate-500 truncate">{clientData?.email || 'Client'}</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-5 text-[#F1F5F9]">
        {renderPage()}
      </main>
    </div>
  )
}
