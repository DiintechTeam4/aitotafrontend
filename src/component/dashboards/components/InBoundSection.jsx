import React, { useState } from 'react';
import InboundReport from './InboundReport';
import InboundLogs from './InboundLogs';
import InboundLeads from './InboundLeads';
import InboundSettings from './InboundSettings';

const InBoundSection = ({ clientId }) => {
  const [activeTab, setActiveTab] = useState('report');
  
  const tabs = [
    { id: 'report', label: 'Report', icon: '📊' },
    { id: 'logs', label: 'Logs/Conversation', icon: '💬' },
    { id: 'leads', label: 'Leads', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'report' && <InboundReport clientId={clientId} />}
        {activeTab === 'logs' && <InboundLogs clientId={clientId} />}
        {activeTab === 'leads' && <InboundLeads clientId={clientId} />}
        {activeTab === 'settings' && <InboundSettings clientId={clientId} />}
      </div>
    </div>
  );
};
export default InBoundSection;