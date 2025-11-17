import React, { useState, useEffect } from "react";
import {
  FaWhatsapp,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaSpinner,
  FaToggleOn,
  FaToggleOff,
  FaEye,
  FaLink,
} from "react-icons/fa";
import { API_BASE_URL } from "../../../config";

const WhatsAppTemplateManagement = ({ clientId, onClose }) => {
  const [activeTab, setActiveTab] = useState("requested"); // requested, assigned, approved
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [clientId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem("admintoken");
      if (!adminToken) {
        throw new Error("Admin token not found");
      }

      const response = await fetch(
        `${API_BASE_URL}/whatsapp-template/requests?clientId=${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      alert(error.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessing(requestId);
      const adminToken = localStorage.getItem("admintoken");
      const response = await fetch(
        `${API_BASE_URL}/whatsapp-template/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requestId }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to approve request");
      }

      alert("Request approved and sent to Naven API");
      await fetchRequests();
    } catch (error) {
      alert(error.message || "Failed to approve request");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(selectedRequest._id);
      const adminToken = localStorage.getItem("admintoken");
      const response = await fetch(
        `${API_BASE_URL}/whatsapp-template/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId: selectedRequest._id,
            reason: rejectReason,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reject request");
      }

      alert("Request rejected successfully");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      alert(error.message || "Failed to reject request");
    } finally {
      setProcessing(null);
    }
  };

  const handleAssign = async (requestId) => {
    try {
      setProcessing(requestId);
      const adminToken = localStorage.getItem("admintoken");
      const response = await fetch(
        `${API_BASE_URL}/whatsapp-template/assign`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requestId }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to assign template");
      }

      alert("Template assigned to agent successfully");
      await fetchRequests();
    } catch (error) {
      alert(error.message || "Failed to assign template");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectFinal = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(selectedRequest._id);
      const adminToken = localStorage.getItem("admintoken");
      const response = await fetch(
        `${API_BASE_URL}/whatsapp-template/reject-final`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId: selectedRequest._id,
            reason: rejectReason,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reject template");
      }

      alert("Template rejected successfully");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      alert(error.message || "Failed to reject template");
    } finally {
      setProcessing(null);
    }
  };

  const handleToggle = async (requestId, currentStatus) => {
    try {
      setProcessing(requestId);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const adminToken = localStorage.getItem("admintoken");
      const response = await fetch(
        `${API_BASE_URL}/whatsapp-template/toggle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requestId, status: newStatus }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to toggle template");
      }

      await fetchRequests();
    } catch (error) {
      alert(error.message || "Failed to toggle template");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: "bg-yellow-100 text-yellow-800",
      admin_approved: "bg-blue-100 text-blue-800",
      admin_rejected: "bg-red-100 text-red-800",
      naven_processing: "bg-purple-100 text-purple-800",
      naven_ready: "bg-green-100 text-green-800",
      assigned: "bg-indigo-100 text-indigo-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          badges[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.replace(/_/g, " ").toUpperCase()}
      </span>
    );
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "requested") {
      return ["requested", "admin_approved", "naven_processing"].includes(
        req.status
      );
    } else if (activeTab === "assigned") {
      return req.status === "naven_ready";
    } else if (activeTab === "approved") {
      return ["assigned", "active", "inactive"].includes(req.status);
    }
    return false;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto"
      style={{ marginLeft: "16rem" }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
              >
                <FaArrowLeft className="text-lg" />
                <span className="text-base">Back</span>
              </button>
              <div className="flex items-center gap-2">
                <FaWhatsapp className="text-green-500 text-2xl" />
                <h1 className="text-2xl font-bold text-gray-800">
                  WhatsApp Template Management
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { key: "requested", label: "Requested", count: requests.filter(r => ["requested", "admin_approved", "naven_processing"].includes(r.status)).length },
              { key: "assigned", label: "Ready to Assign", count: requests.filter(r => r.status === "naven_ready").length },
              { key: "approved", label: "Approved", count: requests.filter(r => ["assigned", "active", "inactive"].includes(r.status)).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-green-500 text-3xl" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <FaWhatsapp className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No templates found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Request #{request.requestClientId?.substring(0, 20) || request._id?.substring(0, 8)}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>

                    {request.client && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Client:</span>{" "}
                          {request.client.businessName || request.client.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span>{" "}
                          {request.client.email}
                        </p>
                      </div>
                    )}

                    {request.agentId && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Agent:</span>{" "}
                          {request.agentId.agentName || "N/A"}
                        </p>
                        {request.agentId.didNumber && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">DID:</span>{" "}
                            {request.agentId.didNumber}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Message:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {request.message || "No message provided"}
                      </div>
                    </div>

                    {request.templateUrl && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Template URL:
                        </p>
                        <a
                          href={request.templateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm break-all"
                        >
                          <FaLink className="text-xs flex-shrink-0" />
                          <span className="break-all">{request.templateUrl}</span>
                        </a>
                      </div>
                    )}

                    {request.rejectionReason && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-red-700 mb-1">
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">
                          {request.rejectionReason}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Created: {new Date(request.createdAt).toLocaleString()}
                      {request.assignedAt && (
                        <> • Assigned: {new Date(request.assignedAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {request.status === "requested" && (
                      <>
                        <button
                          onClick={() => handleApprove(request._id)}
                          disabled={processing === request._id}
                          className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          {processing === request._id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaCheck />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <FaTimes />
                          Reject
                        </button>
                      </>
                    )}

                    {request.status === "naven_ready" && (
                      <>
                        <button
                          onClick={() => handleAssign(request._id)}
                          disabled={processing === request._id}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          {processing === request._id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaCheck />
                          )}
                          Assign
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <FaTimes />
                          Reject
                        </button>
                      </>
                    )}

                    {request.status === "assigned" && (
                      <button
                        onClick={() => handleToggle(request._id, "inactive")}
                        disabled={processing === request._id}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {processing === request._id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaToggleOff />
                        )}
                        Activate
                      </button>
                    )}

                    {request.status === "active" && (
                      <button
                        onClick={() => handleToggle(request._id, "active")}
                        disabled={processing === request._id}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {processing === request._id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaToggleOn />
                        )}
                        Deactivate
                      </button>
                    )}

                    {request.status === "inactive" && (
                      <button
                        onClick={() => handleToggle(request._id, "inactive")}
                        disabled={processing === request._id}
                        className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {processing === request._id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaToggleOn />
                        )}
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Reject Request
              </h3>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="4"
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedRequest.status === "naven_ready") {
                    handleRejectFinal();
                  } else {
                    handleReject();
                  }
                }}
                disabled={processing === selectedRequest._id}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 text-sm"
              >
                {processing === selectedRequest._id ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplateManagement;

