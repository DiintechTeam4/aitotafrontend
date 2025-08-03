import React, { useEffect, useState } from "react";
import { FiFileText, FiMessageCircle, FiPhone } from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const statusLabels = {
  veryInterested: "Very Interested",
  maybe: "Maybe",
  enrolled: "Enrolled",
  junkLead: "Junk Lead",
  notRequired: "Not Required",
  enrolledOther: "Enrolled Other",
  decline: "Decline",
  notEligible: "Not Eligible",
  wrongNumber: "Wrong Number",
  hotFollowup: "Hot Follow-up",
  coldFollowup: "Cold Follow-up",
  schedule: "Schedule",
  notConnected: "Not connected",
};

const statusColors = {
  veryInterested: "bg-green-100 text-green-800",
  maybe: "bg-yellow-100 text-yellow-800",
  enrolled: "bg-blue-100 text-blue-800",
  junkLead: "bg-red-100 text-red-800",
  notRequired: "bg-gray-100 text-gray-800",
  enrolledOther: "bg-purple-100 text-purple-800",
  decline: "bg-red-100 text-red-800",
  notEligible: "bg-orange-100 text-orange-800",
  wrongNumber: "bg-gray-100 text-gray-800",
  hotFollowup: "bg-red-100 text-red-800",
  coldFollowup: "bg-blue-100 text-blue-800",
  schedule: "bg-green-100 text-green-800",
  notConnected: "bg-red-100 text-red-800",
};

const InboundLeads = ({ clientId }) => {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/client/inbound/leads`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setLeads(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch leads data");
        }
      } catch (err) {
        console.error("Error fetching leads:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">
          <p className="font-medium">Error loading leads:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!leads) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">No leads data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Leads</h3>
      {Object.entries(leads).map(([key, categoryData]) => {
        // Skip categories with no data
        if (!categoryData.data || categoryData.data.length === 0) {
          return null;
        }

        return (
          <div
            key={key}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div
              className={`px-6 py-4 border-b border-gray-200 ${
                statusColors[key] || "bg-gray-100 text-gray-800"
              }`}
            >
              <h4 className="font-medium">
                {statusLabels[key] || key} (
                {categoryData.count || categoryData.data.length})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transcript
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Play
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Call
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryData.data.map((lead, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lead.mobile || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.duration ? `${lead.duration}s` : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => alert(lead.transcript)}
                          className="text-gray-600 hover:text-gray-800 text-lg"
                          title="View Transcript"
                        >
                          <FiFileText className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.audioUrl ? (
                          <audio
                            controls
                            src={lead.audioUrl}
                            className="h-8"
                            style={{ width: "120px" }}
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No audio
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.mobile ? (
                          <a
                            href={`https://wa.me/${lead.mobile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                          >
                            <FiMessageCircle className="w-3 h-3 mr-1" />
                            WhatsApp
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No mobile
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.mobile ? (
                          <a
                            href={`tel:${lead.mobile}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                          >
                            <FiPhone className="w-3 h-3 mr-1" />
                            Call
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No mobile
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default InboundLeads;
