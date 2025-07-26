import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config';

const statusLabels = {
  veryInterested: 'Very Interested',
  medium: 'Medium',
  notInterested: 'Not Interested'
};

const statusColors = {
  veryInterested: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  notInterested: 'bg-red-100 text-red-800'
};

const InboundLeads = ({ clientId }) => {
  const [leads, setLeads] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE_URL}/client/inbound/leads?clientId=${clientId}`)
      .then(res => res.json())
      .then(setLeads);
  }, [clientId]);
  
  if (!leads) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading...</span>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Leads</h3>
      {Object.entries(leads).map(([key, items]) => (
        <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className={`px-6 py-4 border-b border-gray-200 ${statusColors[key]}`}>
            <h4 className="font-medium">{statusLabels[key]} ({items.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transcript</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Play</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((lead, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.mobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(lead.time).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => alert(lead.transcript)}
                        className="text-blue-600 hover:text-blue-800 text-lg"
                        title="View Transcript"
                      >
                        📝
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <audio controls src={lead.audioUrl} className="h-8" style={{ width: '120px' }} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a 
                        href={`https://wa.me/${lead.mobile}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                      >
                        WhatsApp
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a 
                        href={`tel:${lead.mobile}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        Call
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
export default InboundLeads;