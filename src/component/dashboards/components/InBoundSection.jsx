import React, { useState } from "react";
import {
  FiBarChart2,
  FiMessageSquare,
  FiUsers,
  FiSettings,
} from "react-icons/fi";
import InboundReport from "./InboundReport";
import InboundLogs from "./InboundLogs";
import InboundLeads from "./InboundLeads";
import InboundSettings from "./InboundSettings";

const InBoundSection = ({ clientId }) => {
  const [activeTab, setActiveTab] = useState("report");

  const tabs = [
    {
      id: "report",
      label: "Report",
      icon: <FiBarChart2 className="w-4 h-4" />,
    },
    {
      id: "logs",
      label: "Conversation",
      icon: <FiMessageSquare className="w-4 h-4" />,
    },
    { id: "leads", label: "Leads", icon: <FiUsers className="w-4 h-4" /> },
    {
      id: "settings",
      label: "AI Agent Settings",
      icon: <FiSettings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 flex-shrink-0">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-black text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "report" && <InboundReport clientId={clientId} />}
        {activeTab === "logs" && <InboundLogs clientId={clientId} />}
        {activeTab === "leads" && <InboundLeads clientId={clientId} />}
        {activeTab === "settings" && <InboundSettings clientId={clientId} />}
      </div>
    </div>
  );
};
export default InBoundSection;
