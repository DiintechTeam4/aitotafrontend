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
  FaArrowLeft,
  FaUserCheck,
  FaIdBadge,
  FaCalendarAlt,
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
          `${API_BASE_URL}/auth/client/profile/client/${clientId}`,
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
    <div
      className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto"
      style={{ marginLeft: "16rem" }}
    >
      {/* Professional Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="flex items-center gap-3 text-gray-600 hover:text-red-600 font-medium px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
              >
                <FaArrowLeft className="text-xl" />
                <span className="text-lg">Back to Dashboard</span>
              </button>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800">
                Client Profile Review
              </h1>
              <p className="text-gray-500 mt-1">
                Review and approve client applications
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-600 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {clientData && (
          <div className="space-y-6">
            {/* Client Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <FaUser className="text-2xl text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {clientData.name ||
                        clientData.contactName ||
                        "Not provided"}
                    </h2>
                    <p className="text-gray-500 text-lg">
                      {clientData.businessName || "Business name not provided"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      clientData.isApproved
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    <FaUserCheck className="mr-2" />
                    {clientData.isApproved ? "Approved" : "Pending Approval"}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Details Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FaIdBadge className="mr-3 text-red-600" />
                Client Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Name */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaUser className="mr-2 text-red-500" />
                    Full Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.name ||
                      clientData.contactName ||
                      "Not provided"}
                  </p>
                </div>

                {/* Business Name */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaBuilding className="mr-2 text-red-500" />
                    Business Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.businessName || "Not provided"}
                  </p>
                </div>

                {/* Mobile Number */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaPhone className="mr-2 text-red-500" />
                    Mobile Number
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.mobileNo ||
                      clientData.contactNumber ||
                      "Not provided"}
                  </p>
                </div>

                {/* GST Number */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaIdCard className="mr-2 text-red-500" />
                    GST Number
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.gstNo || clientData.gst || "Not provided"}
                  </p>
                </div>

                {/* PAN Number */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaIdCard className="mr-2 text-red-500" />
                    PAN Number
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.panNo || clientData.pancard || "Not provided"}
                  </p>
                </div>

                {/* Email */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaGlobe className="mr-2 text-red-500" />
                    Email Address
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.email || "Not provided"}
                  </p>
                </div>

                {/* Address */}
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-red-500" />
                    Address
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.address || "Not provided"}
                  </p>
                </div>

                {/* City */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-red-500" />
                    City
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.city || "Not provided"}
                  </p>
                </div>

                {/* Pincode */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-red-500" />
                    Pincode
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.pincode || "Not provided"}
                  </p>
                </div>

                {/* Website */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaGlobe className="mr-2 text-red-500" />
                    Website
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.websiteUrl ||
                      clientData.website ||
                      "Not provided"}
                  </p>
                </div>

                {/* Created At */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FaCalendarAlt className="mr-2 text-red-500" />
                    Registration Date
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {clientData.createdAt
                      ? new Date(clientData.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "Not provided"}
                  </p>
                </div>

                {/* Business Logo */}
                {clientData.businessLogoUrl && (
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <FaBuilding className="mr-2 text-red-500" />
                      Business Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      <img
                        src={clientData.businessLogoUrl}
                        alt="Business Logo"
                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                      />
                      <div>
                        <p className="text-sm text-gray-600">Logo available</p>
                        <p className="text-xs text-gray-500">
                          Professional branding image
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Decision Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FaCheck className="mr-3 text-red-600" />
                Review Decision
              </h3>

              <div className="flex justify-end space-x-4">
                {clientData?.isApproved ? (
                  // Show Already Approved button when client is approved
                  <button
                    disabled
                    className="px-8 py-4 bg-blue-500 text-white rounded-lg flex items-center cursor-not-allowed font-medium text-lg opacity-75"
                  >
                    Already Approved
                  </button>
                ) : (
                  // Show Approve button when conditions are not met
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 font-medium text-lg shadow-sm hover:shadow-md"
                  >
                    {approving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-3" />
                        Approve Client {clientData.name}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalFormDetails;
