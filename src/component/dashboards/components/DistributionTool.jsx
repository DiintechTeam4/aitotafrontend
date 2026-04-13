import { useState } from 'react'
import { FiPhone, FiMessageSquare, FiMail, FiMessageCircle, FiArrowLeft } from 'react-icons/fi'
import WhatsAiApp from '../whatsai/WhatsAiApp'

const tools = [
  {
    key: 'whatsai',
    name: 'WhatsAi',
    subtitle: 'AI WhatsApp Agent',
    icon: <FiMessageSquare className="w-8 h-8" />,
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    badgeColor: 'bg-green-100 text-green-700',
    available: true,
  },
  {
    key: 'aitota',
    name: 'Aitota',
    subtitle: 'AI Calling Agent',
    icon: <FiPhone className="w-8 h-8" />,
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
    available: false,
  },
  {
    key: 'aimail',
    name: 'Aimail',
    subtitle: 'AI Email Agent',
    icon: <FiMail className="w-8 h-8" />,
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-700',
    available: false,
  },
  {
    key: 'aisms',
    name: 'AiSMS',
    subtitle: 'AI Message Agent',
    icon: <FiMessageCircle className="w-8 h-8" />,
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-700',
    available: false,
  },
]

export default function DistributionTool() {
  const [activeTool, setActiveTool] = useState(null)

  if (activeTool === 'whatsai') {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTool(null)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Distribution Tool
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <WhatsAiApp />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h2 className="text-3xl font-bold text-gray-900">Distribution Tool</h2>
        <p className="text-gray-500 mt-1 text-sm">Choose an AI agent to distribute your campaigns</p>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.key}
              className={`border-2 rounded-2xl p-6 flex flex-col items-center text-center gap-4 transition-shadow ${tool.color} ${tool.available ? 'cursor-pointer hover:shadow-md' : ''}`}
              onClick={() => tool.available && setActiveTool(tool.key)}
            >
              <div className={`p-4 rounded-full bg-white shadow-sm ${tool.iconColor}`}>
                {tool.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{tool.name}</h3>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${tool.badgeColor}`}>
                  {tool.subtitle}
                </span>
              </div>
              <button
                type="button"
                disabled={!tool.available}
                onClick={(e) => { e.stopPropagation(); tool.available && setActiveTool(tool.key) }}
                className={`mt-2 w-full py-2 rounded-lg border text-sm font-medium transition-colors ${
                  tool.available
                    ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {tool.available ? 'Open' : 'Coming Soon'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
