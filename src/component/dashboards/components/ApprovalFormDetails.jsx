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

      // Get client data from admin endpoint (contains isApproved and isprofileCompleted flags)
      const clientResponse = await fetch(
        `${API_BASE_URL}/admin/getclientbyid/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!clientResponse.ok) {
        throw new Error("Failed to fetch client data");
      }

      const clientDataResult = await clientResponse.json();

      if (!clientDataResult.success || !clientDataResult.data) {
        throw new Error("Invalid client data received");
      }

      const client = clientDataResult.data;
      console.log("Client model data received:", client);
      console.log("Client isApproved value:", client.isApproved);
      console.log(
        "Client isprofileCompleted value:",
        client.isprofileCompleted
      );

      // Try to get profile data if it exists
      let profileData = null;
      try {
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

        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          profileData = profileResult.profile;
          console.log("Profile data received:", profileData);
        }
      } catch (profileError) {
        console.log(
          "Profile not found or error fetching profile:",
          profileError.message
        );
      }

      // Combine client and profile data
      const combinedData = {
        // Client model data (contains approval flags)
        ...client,
        // Profile data (if exists)
        ...(profileData && {
          businessName: profileData.businessName || client.businessName,
          contactName: profileData.contactName || client.name,
          contactNumber: profileData.contactNumber || client.mobileNo,
          pancard: profileData.pancard || client.panNo,
          gst: profileData.gst || client.gstNo,
          website: profileData.website || client.websiteUrl,
          address: profileData.address || client.address,
          city: profileData.city || client.city,
          pincode: profileData.pincode || client.pincode,
          state: profileData.state,
          businessType: profileData.businessType,
          annualTurnover: profileData.annualTurnover,
        }),
      };

      setClientData(combinedData);
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
            No Profile Found
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Name
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.name || clientData.contactName || "Not provided"}
                </p>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Business Name
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.businessName || "Not provided"}
                </p>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Mobile Number
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.mobileNo ||
                    clientData.contactNumber ||
                    "Not provided"}
                </p>
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  GST Number
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.gstNo || clientData.gst || "Not provided"}
                </p>
              </div>

              {/* PAN Number */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  PAN Number
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.panNo || clientData.pancard || "Not provided"}
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Address
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.address || "Not provided"}
                </p>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  City
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.city || "Not provided"}
                </p>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Pincode
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.pincode || "Not provided"}
                </p>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Website
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.websiteUrl ||
                    clientData.website ||
                    "Not provided"}
                </p>
              </div>

              {/* User ID */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  User ID
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.userId || clientData.clientId || "Not provided"}
                </p>
              </div>

              {/* Created At */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Created At
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {clientData.createdAt
                    ? new Date(clientData.createdAt).toLocaleString()
                    : "Not provided"}
                </p>
              </div>

              {/* Business Logo URL */}
              {clientData.businessLogoUrl && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Business Logo
                  </label>
                  <div className="flex items-center space-x-3">
                    {clientData.businessLogoUrl && (
                      <img
                        src={clientData.businessLogoUrl}
                        alt="Business Logo"
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                    )}
                    <p className="text-sm text-gray-600">Logo URL available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Review Decision
          </h2>
          <div className="flex justify-end space-x-4">
            {clientData?.isApproved ? (
              // Show Already Approved button when client is approved
              <button
                disabled
                className="px-6 py-3 bg-green-500 text-white rounded-md flex items-center cursor-not-allowed"
              >
                Already Approved
              </button>
            ) : (
              // Show Approve button when conditions are not met
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalFormDetails;
