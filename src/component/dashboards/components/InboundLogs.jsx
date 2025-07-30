import React, { useEffect, useState } from "react";
import { FiFileText, FiClipboard } from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const statusColors = {
  very_interested: "bg-green-500",
  medium: "bg-yellow-500",
  not_interested: "bg-red-500",
  not_connected: "bg-gray-400",
};

const statusTextColors = {
  very_interested: "text-green-700",
  medium: "text-yellow-700",
  not_interested: "text-red-700",
  not_connected: "text-gray-700",
};

const InboundLogs = ({ clientId }) => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/client/inbound/logs`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setLogs(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch logs data");
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
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
          <p className="font-medium">Error loading logs:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">
        Logs / Conversation
      </h3>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                  Transcript
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Play
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.mobile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => alert(log.transcript)}
                      className="text-gray-600 hover:text-gray-800 text-lg"
                      title="View Transcript"
                    >
                      <FiFileText className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <audio
                      controls
                      src={log.audioUrl}
                      className="h-8"
                      style={{ width: "120px" }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          statusColors[log.leadStatus]
                        }`}
                      ></span>
                      <span
                        className={`text-sm font-medium capitalize ${
                          statusTextColors[log.leadStatus]
                        }`}
                      >
                        {log.leadStatus.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FiClipboard className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500">No logs available</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default InboundLogs;
