import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config';

const InboundReport = ({ clientId }) => {
  const [report, setReport] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE_URL}/client/inbound/report?clientId=${clientId}`)
      .then(res => res.json())
      .then(setReport);
  }, [clientId]);
  
  if (!report) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading...</span>
    </div>
  );
  
  const stats = [
    {
      label: 'Total Calls',
      value: report.totalCalls,
      icon: '📞',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      label: 'Total Connected',
      value: report.totalConnected,
      icon: '✅',
      color: 'bg-green-100 text-green-800'
    },
    {
      label: 'Total Not Connected',
      value: report.totalNotConnected,
      icon: '❌',
      color: 'bg-red-100 text-red-800'
    },
    {
      label: 'Total Conversation Time',
      value: `${report.totalConversationTime} sec`,
      icon: '⏱️',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      label: 'Average Call Duration',
      value: `${report.avgCallDuration.toFixed(2)} sec`,
      icon: '📊',
      color: 'bg-yellow-100 text-yellow-800'
    }
  ];
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Call Report</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color} text-2xl mr-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Connection Rate Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Connection Rate</h4>
        <div className="flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500" 
              style={{
                width: `${report.totalCalls > 0 ? (report.totalConnected / report.totalCalls) * 100 : 0}%`
              }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {report.totalCalls > 0 ? Math.round((report.totalConnected / report.totalCalls) * 100) : 0}%
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {report.totalConnected} out of {report.totalCalls} calls connected
        </p>
      </div>
    </div>
  );
};
export default InboundReport;