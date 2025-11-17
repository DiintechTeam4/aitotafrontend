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
  FaEdit,
  FaTrash,
  FaEllipsisV,
  FaWhatsapp,
} from "react-icons/fa";
import { API_BASE_URL } from "../../../config";
import { FiUserCheck } from "react-icons/fi";

const ApprovalFormDetails = ({ clientId, onClose, onApprove, onEdit, onWhatsAppClick }) => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(false);
  const [clientToken, setClientToken] = useState("");
  const [clientType, setClientType] = useState("new");
  const [updatingType, setUpdatingType] = useState(false);
  const [updateTypeMsg, setUpdateTypeMsg] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showMenu, setShowMenu] = useState(false);

  const getClientTypeBadgeClass = (type) => {
    const t = (type || "").toString().toLowerCase();
    if (t === "prime")
      return "bg-purple-100 text-purple-800 border border-purple-200";
    if (t === "demo")
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    if (t === "testing")
      return "bg-violet-100 text-violet-800 border border-violet-200";
    if (t === "owned")
      return "bg-green-100 text-green-800 border border-green-200";
    if (t === "new") return "bg-gray-100 text-gray-800 border border-gray-200";
    if (t === "rejected")
      return "bg-red-100 text-red-800 border border-red-200";
    return "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const getClientTypeLabel = (type) => {
    if (!type) return "Not provided";
    const t = type.toString();
    // Keep 'Prime' casing if already capitalized from backend enum
    if (t.toLowerCase() === "prime") return "Prime";
    const lower = t.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  useEffect(() => {
    fetchClientProfile();
  }, [clientId]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event) => {
      const menuButton = event.target.closest('button[aria-label="Menu"]') || event.target.closest('.relative');
      if (!menuButton) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const timedFetch = async (url, options = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      return resp;
    } finally {
      clearTimeout(id);
    }
  };

  const fetchClientProfile = async () => {
    try {
      setLoading(true);
      setError("");
      if (!clientId) {
        throw new Error("Missing client id");
      }

      const adminToken = localStorage.getItem("admintoken");
      if (!adminToken) {
        throw new Error("Admin token not found");
      }

      // First, get the client token using admin credentials
      const tokenResponse = await timedFetch(
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
      const clientResponse = await timedFetch(
        `${API_BASE_URL}/admin/getclient/${clientId}`,
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
        const profileResponse = await timedFetch(
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
      setClientToken(clientToken);
      setEditForm({
        name: combinedData.name || combinedData.contactName || "",
        businessName: combinedData.businessName || "",
        mobileNo: combinedData.mobileNo || combinedData.contactNumber || "",
        websiteUrl: combinedData.websiteUrl || combinedData.website || "",
        address: combinedData.address || "",
        city: combinedData.city || "",
        pincode: combinedData.pincode || "",
        gstNo: combinedData.gstNo || combinedData.gst || "",
        panNo: combinedData.panNo || combinedData.pancard || "",
      });
      try {
        const normalizedType = (client.clientType || "new")
          .toString()
          .toLowerCase();
        setClientType(
          ["prime", "demo", "testing", "owned", "new"].includes(normalizedType)
            ? normalizedType
            : "new"
        );
      } catch {}
    } catch (err) {
      console.error("Error fetching client profile:", err);
      setError(err.message || "Failed to fetch client profile");
    } finally {
      setLoading(false);
    }
  };

  const clientTypeOptions = [
    { value: "new", label: "New" },
    { value: "prime", label: "Prime" },
    { value: "demo", label: "Demo" },
    { value: "testing", label: "Testing" },
    { value: "owned", label: "Owned" },
    { value: "rejected", label: "Rejected" },
  ];

  const handleUpdateClientType = async () => {
    try {
      setUpdatingType(true);
      setUpdateTypeMsg("");

      if (!clientToken) {
        throw new Error("Client token missing");
      }

      // Backend enum expects 'Prime' with capital P; others are lowercase
      const serverValue = clientType === "prime" ? "Prime" : clientType;

      const resp = await fetch(`${API_BASE_URL}/client/client-type`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientType: serverValue }),
      });

      const result = await resp.json();
      if (!resp.ok || !result?.success) {
        throw new Error(
          result?.error || result?.message || "Failed to update Account type"
        );
      }

      // Reflect change locally; if rejected, also force isApproved to false in UI
      setClientData((prev) => {
        if (!prev) return prev;
        const next = { ...prev, clientType: serverValue };
        if (String(serverValue).toLowerCase() === "rejected") {
          next.isApproved = false;
        }
        return next;
      });
      setUpdateTypeMsg("Account type updated");
      setTimeout(() => setUpdateTypeMsg(""), 2000);
    } catch (e) {
      setUpdateTypeMsg(e.message || "Update failed");
    } finally {
      setUpdatingType(false);
    }
  };

  const handleApprove = async () => {
    try {
      // Confirm before proceeding
      const confirmed = window.confirm(
        "Are you sure you want to approve this account?"
      );
      if (!confirmed) return;

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

  const startEdit = () => {
    setEditMode(true);
  };

  const handleDeleteClient = () => {
    setShowDeleteModal(true);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteClient = async () => {
    try {
      setDeleting(true);
      const adminToken = localStorage.getItem("admintoken");
      if (!adminToken) throw new Error("Admin token not found");
      const resp = await fetch(
        `${API_BASE_URL}/admin/deleteclient/${clientId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || result?.success !== true) {
        throw new Error(
          result?.message || result?.error || "Failed to delete client"
        );
      }
      alert("Client deleted successfully");
      setShowDeleteModal(false);
      if (onClose) onClose();
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    // Reset form back to latest clientData and exit edit mode
    if (clientData) {
      setEditForm({
        name: clientData.name || clientData.contactName || "",
        businessName: clientData.businessName || "",
        mobileNo: clientData.mobileNo || clientData.contactNumber || "",
        websiteUrl: clientData.websiteUrl || clientData.website || "",
        address: clientData.address || "",
        city: clientData.city || "",
        pincode: clientData.pincode || "",
        gstNo: clientData.gstNo || clientData.gst || "",
        panNo: clientData.panNo || clientData.pancard || "",
      });
    }
    setEditMode(false);
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const adminToken = localStorage.getItem("admintoken");
      if (!adminToken) throw new Error("Admin token not found");

      // Basic client-side validations
      if (!editForm.name || !editForm.businessName) {
        alert("Please fill Name and Business Name");
        return;
      }

      const resp = await fetch(
        `${API_BASE_URL}/admin/update-client/${clientId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        }
      );

      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || result?.success === false) {
        throw new Error(
          result?.error || result?.message || "Failed to update profile"
        );
      }

      // Refresh local data without refetch when possible
      setClientData((prev) => ({
        ...(prev || {}),
        name: editForm.name,
        businessName: editForm.businessName,
        mobileNo: editForm.mobileNo,
        websiteUrl: editForm.websiteUrl,
        address: editForm.address,
        city: editForm.city,
        pincode: editForm.pincode,
        gstNo: editForm.gstNo,
        panNo: editForm.panNo,
      }));
      setEditMode(false);
      alert("Client information updated");
    } catch (e) {
      alert(e.message || "Update failed");
    } finally {
      setSavingProfile(false);
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
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
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
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
              >
                <FaArrowLeft className="text-lg" />
                <span className="text-base">Back to Dashboard</span>
              </button>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">
                Client Profile Review
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onWhatsAppClick) {
                    onWhatsAppClick(clientId);
                  }
                }}
                className="px-4 py-2 rounded-full bg-green-500 text-white transition-colors flex items-center font-semibold text-xs shadow-sm hover:bg-green-600"
              >
                <FaWhatsapp className="mr-2 text-white" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-5">
        {clientData && (
          <div className="space-y-5">
            {/* Client Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    {/* Business Logo */}
                    {clientData.businessLogoUrl && (
                      <div className="flex items-center">
                        <img
                          src={clientData.businessLogoUrl}
                          alt="Business Logo"
                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-800">
                        {clientData.name ||
                          clientData.contactName ||
                          "Not provided"}
                      </h2>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {clientData.businessName || "Business name not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end text-right">
                  <div className="flex justify-end items-center space-x-3">
                    <button
                      onClick={startEdit}
                      className="px-4 py-2 rounded-full bg-blue-500 text-white transition-colors flex items-center font-semibold text-xs shadow-sm hover:bg-blue-700"
                    >
                      <FaEdit className="mr-2 text-white" />
                      Edit Info
                    </button>
                    {String(clientData.clientType || "").toLowerCase() ===
                    "rejected" ? null : clientData?.isApproved ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled
                          className="px-4 py-2 rounded-full flex items-center cursor-not-allowed font-medium text-xs bg-green-100 text-green-700 border border-green-300"
                        >
                          <FiUserCheck className="mr-2" />
                          Approved
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenu(!showMenu);
                            }}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Menu"
                          >
                            <FaEllipsisV className="text-gray-600" />
                          </button>
                          {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                              <button
                                onClick={() => {
                                  setClientType("prime");
                                  handleUpdateClientType();
                                  setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Prime
                              </button>
                              <button
                                onClick={() => {
                                  // Shift Prime logic here
                                  setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Shift Prime
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteClient();
                                  setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleApprove}
                        disabled={approving}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white transition-colors flex items-center disabled:opacity-50 font-semibold text-xs shadow-md hover:from-green-600 hover:to-emerald-700"
                      >
                        {approving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Approving...
                          </>
                        ) : (
                          <>
                            <FaCheck className="mr-2 text-white" />
                            Click to Approve
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div
                    className={`inline-flex items-center mx-3 px-3 py-1.5 rounded-full text-xs font-semibold ${getClientTypeBadgeClass(
                      clientData.clientType
                    )}`}
                  >
                    {String(clientData.clientType || "").toLowerCase() ===
                    "prime" ? (
                      <span className="mx-2" role="img" aria-label="crown">
                        👑
                      </span>
                    ) : (
                      <FaIdBadge className="mx-2" />
                    )}
                    {getClientTypeLabel(clientData.clientType)}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Details Grid (view or edit mode) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaIdBadge className="mr-2 text-red-600" />
                Client Information
              </h3>
              {editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Full Name
                    </label>
                    <input
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Business Name
                    </label>
                    <input
                      value={editForm.businessName || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessName: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Business Name"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      value={editForm.mobileNo || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, mobileNo: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Phone"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      GST Number
                    </label>
                    <input
                      value={editForm.gstNo || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, gstNo: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="GST"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      PAN Number
                    </label>
                    <input
                      value={editForm.panNo || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, panNo: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="PAN"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Website
                    </label>
                    <input
                      value={editForm.websiteUrl || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, websiteUrl: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Website"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Address
                    </label>
                    <input
                      value={editForm.address || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Address"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      City
                    </label>
                    <input
                      value={editForm.city || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, city: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="City"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Pincode
                    </label>
                    <input
                      value={editForm.pincode || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, pincode: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Pincode"
                    />
                  </div>
                  <div className="md:col-span-3 flex items-center gap-3 mt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaUser className="mr-2 text-red-500" />
                      Full Name
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.name ||
                        clientData.contactName ||
                        "Not provided"}
                    </p>
                  </div>

                  {/* Business Name */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaBuilding className="mr-2 text-red-500" />
                      Business Name
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.businessName || "Not provided"}
                    </p>
                  </div>

                  {/* Mobile Number */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaPhone className="mr-2 text-red-500" />
                      Mobile Number
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.mobileNo ||
                        clientData.contactNumber ||
                        "Not provided"}
                    </p>
                  </div>

                  {/* GST Number */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaIdCard className="mr-2 text-red-500" />
                      GST Number
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.gstNo || clientData.gst || "Not provided"}
                    </p>
                  </div>

                  {/* PAN Number */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaIdCard className="mr-2 text-red-500" />
                      PAN Number
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.panNo || clientData.pancard || "Not provided"}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaGlobe className="mr-2 text-red-500" />
                      Email Address
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.email || "Not provided"}
                    </p>
                  </div>

                  {/* Address */}
                  <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-red-500" />
                      Address
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.address || "Not provided"}
                    </p>
                  </div>

                  {/* City */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-red-500" />
                      City
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.city || "Not provided"}
                    </p>
                  </div>

                  {/* Pincode */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-red-500" />
                      Pincode
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.pincode || "Not provided"}
                    </p>
                  </div>

                  {/* Website */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaGlobe className="mr-2 text-red-500" />
                      Website
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.websiteUrl ||
                        clientData.website ||
                        "Not provided"}
                    </p>
                  </div>

                  {/* Client Type */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaIdBadge className="mr-2 text-red-500" />
                      Account Type
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={clientType}
                        onChange={(e) => setClientType(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                      >
                        {clientTypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleUpdateClientType}
                        disabled={updatingType}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updatingType ? "Saving..." : "Update"}
                      </button>
                    </div>
                    {updateTypeMsg && (
                      <p className="mt-1 text-xs text-gray-600">
                        {updateTypeMsg}
                      </p>
                    )}
                  </div>

                  {/* Created At */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                      <FaCalendarAlt className="mr-2 text-red-500" />
                      Registration Date
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {clientData.createdAt
                        ? new Date(clientData.createdAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )
                        : "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
                  <div className="px-5 py-4 border-b border-gray-200">
                    <h4 className="m-0 text-lg font-semibold text-gray-800">
                      Delete Client
                    </h4>
                  </div>
                  <div className="px-5 py-4 text-sm text-gray-700">
                    Are you sure you want to delete this client? This action
                    cannot be undone.
                  </div>
                  <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteClient}
                      className={`px-4 py-2 rounded-md text-sm text-white ${
                        deleting ? "bg-red-400" : "bg-red-600 hover:bg-red-700"
                      }`}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalFormDetails;
