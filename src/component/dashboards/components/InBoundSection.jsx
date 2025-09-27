import React, { useMemo, useState } from "react";
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
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const effectiveParams = useMemo(() => {
    if (filter === "custom" && startDate && endDate) {
      return { filter: undefined, startDate, endDate };
    }
    return { filter, startDate: undefined, endDate: undefined };
  }, [filter, startDate, endDate]);

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
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 flex-shrink-0">
        <nav
          className="flex space-x-8 px-6 items-center justify-between"
          aria-label="Tabs"
        >
          <div className="flex space-x-8">
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
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 py-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-2 py-1"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 days</option>
              <option value="custom">Custom range</option>
            </select>
            {filter === "custom" && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-md text-sm px-2 py-1"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-md text-sm px-2 py-1"
                />
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "report" && (
          <InboundReport
            clientId={clientId}
            filter={effectiveParams.filter}
            startDate={effectiveParams.startDate}
            endDate={effectiveParams.endDate}
          />
        )}
        {activeTab === "logs" && (
          <InboundLogs
            clientId={clientId}
            filter={effectiveParams.filter}
            startDate={effectiveParams.startDate}
            endDate={effectiveParams.endDate}
          />
        )}
        {activeTab === "leads" && (
          <InboundLeads
            clientId={clientId}
            filter={effectiveParams.filter}
            startDate={effectiveParams.startDate}
            endDate={effectiveParams.endDate}
          />
        )}
        {activeTab === "settings" && <InboundSettings clientId={clientId} />}
      </div>
    </div>
  );
};
export default InBoundSection;
