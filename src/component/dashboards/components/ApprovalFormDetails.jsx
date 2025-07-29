import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaCheck,
  FaTimes as FaX,
  FaBuilding,
  FaUser,
  FaPhone,
  FaGlobe,
  FaMapMarkerAlt,
  FaIdCard,
  FaRupeeSign,
} from "react-icons/fa";
import { API_BASE_URL } from "../../../config";

const ApprovalFormDetails = ({ clientId, onClose, onApprove }) => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchClientProfile();
  }, [clientId]);

  const fetchClientProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const adminToken = localStorage.getItem("admintoken");
      if (!adminToken) {
        throw new Error("Admin token not found");
      }

      // First, get the client token using admin credentials
      const tokenResponse = await fetch(
        `${API_BASE_URL}/admin/get-client-token/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(
          errorData.message || "Failed to get client access token"
        );
      }

      const tokenData = await tokenResponse.json();
      const clientToken = tokenData.token;

      if (!clientToken) {
        throw new Error("No client token received");
      }

      // Now use the client token to fetch the client profile
      const profileResponse = await fetch(
        `${API_BASE_URL}/auth/client/profile/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${clientToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.message || "Failed to fetch client profile");
      }

      const data = await profileResponse.json();
      setClientData(data.profile); // Use the profile object from the response
    } catch (err) {
      console.error("Error fetching client profile:", err);
      setError(err.message || "Failed to fetch client profile");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);

      const adminToken = localStorage.getItem("admintoken");
      if (!adminToken) {
        throw new Error("Admin token not found");
      }

      // Call the approve client API directly with admin token
      const response = await fetch(
        `${API_BASE_URL}/admin/approve-client/${clientId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve client");
      }

      const data = await response.json();
      alert("Client approved successfully!");

      // Call the onApprove callback
      if (onApprove) {
        onApprove(clientId);
      }

      onClose();
    } catch (err) {
      console.error("Error approving client:", err);
      alert(err.message || "Failed to approve client");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium px-4 py-2 rounded transition"
            >
              <span className="text-xl">&larr;</span> Back
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Client Profile Review
          </h1>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-600 p-2 rounded transition"
          >
            <FaTimes size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {clientData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  address
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.address || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  annualTurnover
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.annualTurnover || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  businessName
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.businessName || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  businessType
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.businessType || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  clientId
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.clientId || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  contactName
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.contactName || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  contactNumber
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.contactNumber || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  createdAt
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.createdAt
                    ? new Date(clientData.createdAt).toLocaleString()
                    : "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  gst
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.gst || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Profile Completed
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.isProfileCompleted ? "true" : "false"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  pancard
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.pancard || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  updatedAt
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.updatedAt
                    ? new Date(clientData.updatedAt).toLocaleString()
                    : "Not provided"}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  website
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.website || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Review Decision
          </h2>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center"
            >
              <FaX className="mr-2" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
            >
              {approving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Approving...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  Approve Client
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalFormDetails;
