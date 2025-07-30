import React, { useEffect, useState } from "react";
import {
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiBarChart2,
} from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const InboundReport = ({ clientId }) => {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/client/inbound/report`,
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
          setReport(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch report data");
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
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
          <p className="font-medium">Error loading report:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">No report data available</div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Calls",
      value: report.totalCalls || 0,
      icon: <FiPhone className="w-6 h-6" />,
      color: "bg-gray-100 text-gray-800",
    },
    {
      label: "Total Connected",
      value: report.totalConnected || 0,
      icon: <FiCheckCircle className="w-6 h-6" />,
      color: "bg-green-100 text-green-800",
    },
    {
      label: "Total Not Connected",
      value: report.totalNotConnected || 0,
      icon: <FiXCircle className="w-6 h-6" />,
      color: "bg-red-100 text-red-800",
    },
    {
      label: "Total Conversation Time",
      value: `${report.totalConversationTime || 0} sec`,
      icon: <FiClock className="w-6 h-6" />,
      color: "bg-gray-100 text-gray-800",
    },
    {
      label: "Average Call Duration",
      value: `${(report.avgCallDuration || 0).toFixed(2)} sec`,
      icon: <FiBarChart2 className="w-6 h-6" />,
      color: "bg-gray-100 text-gray-800",
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Call Report</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color} mr-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Connection Rate Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Connection Rate
        </h4>
        <div className="flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
            <div
              className="bg-black h-4 rounded-full transition-all duration-500"
              style={{
                width: `${
                  report.totalCalls > 0
                    ? (report.totalConnected / report.totalCalls) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {report.totalCalls > 0
              ? Math.round((report.totalConnected / report.totalCalls) * 100)
              : 0}
            %
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
