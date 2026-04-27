import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaSignInAlt, FaBuilding, FaSearch, FaTimes, FaList } from "react-icons/fa";
import { API_BASE_URL } from "../../../config";

const WorkspaceManagement = ({ onLogin, onManageTabs }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [loadingLoginId, setLoadingLoginId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    websiteUrl: "",
    city: "",
    pincode: "",
    gstNo: "",
    panNo: "",
    mobileNo: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");

  const handleWorkspaceLogin = async (workspace) => {
    try {
      setLoadingLoginId(workspace._id);
      if (!token) throw new Error("Admin session missing. Please login again.");

      // Workspace dashboard is an admin-only view.
      // It expects:
      // - `admintoken` available (localStorage or sessionStorage)
      // - `activeWorkspace` present in localStorage
      //
      // NOTE: sessionStorage does not carry to new tabs, so ensure token exists in localStorage.
      if (!localStorage.getItem("admintoken")) {
        localStorage.setItem("admintoken", token);
      }
      localStorage.setItem("activeWorkspace", JSON.stringify(workspace));

      const newWindow = window.open("/workspace/dashboard", "_blank");
      if (!newWindow) {
        alert("Popup blocked! Please allow popups.");
        return;
      }
    } catch (error) {
      alert(error.message || "Failed to open workspace dashboard");
    } finally {
      setLoadingLoginId(null);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWorkspaces(data.workspaces || []);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleOpenModal = (workspace = null) => {
    if (workspace) {
      setEditingWorkspace(workspace);
      setFormData({
        name: workspace.name || "",
        email: workspace.email || "",
        password: "",
        confirmPassword: "",
        businessName: workspace.businessName || "",
        websiteUrl: workspace.websiteUrl || "",
        city: workspace.city || "",
        pincode: workspace.pincode || "",
        gstNo: workspace.gstNo || "",
        panNo: workspace.panNo || "",
        mobileNo: workspace.mobileNo || "",
        address: workspace.address || "",
      });
    } else {
      setEditingWorkspace(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        websiteUrl: "",
        city: "",
        pincode: "",
        gstNo: "",
        panNo: "",
        mobileNo: "",
        address: "",
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingWorkspace 
        ? `${API_BASE_URL}/workspaces/${editingWorkspace._id}`
        : `${API_BASE_URL}/workspaces`;
      
      const method = editingWorkspace ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(editingWorkspace ? "Workspace updated" : "Workspace created");
        setShowModal(false);
        fetchWorkspaces();
      } else {
        alert(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving workspace:", error);
      alert("Error saving workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert("Workspace deleted");
        fetchWorkspaces();
      }
    } catch (error) {
      console.error("Error deleting workspace:", error);
      alert("Error deleting workspace");
    }
  };

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Apps Management</h2>
          <p className="text-gray-500 text-sm">Create business units to group your clients</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center transition-all shadow-md active:scale-95"
        >
          <FaPlus className="mr-2" /> New Workspace
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search workspaces..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Workspace</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredWorkspaces.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <FaBuilding className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                    <p className="text-lg font-medium text-gray-400">No workspaces found</p>
                    <button onClick={() => handleOpenModal()} className="text-purple-600 hover:underline mt-2">Create your first workspace</button>
                  </td>
                </tr>
              ) : (
                filteredWorkspaces.map((workspace) => (
                  <tr key={workspace._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-11 w-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-4 text-lg shadow-sm">
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{workspace.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{workspace.businessName || "No business name"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 font-medium">{workspace.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{workspace.mobileNo || "No number"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{workspace.city || "-"}</p>
                      <p className="text-xs text-gray-500">{workspace.pincode || ""}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleWorkspaceLogin(workspace)}
                          disabled={loadingLoginId === workspace._id}
                          className="flex items-center bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          <FaSignInAlt className="mr-1.5" />
                          {loadingLoginId === workspace._id ? "Loading..." : "Login"}
                        </button>
                        <button
                          onClick={() => onManageTabs(workspace)}
                          className="flex items-center bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Manage Workspace Tabs"
                        >
                          <FaList className="mr-1.5" /> Manage Tabs
                        </button>
                        <button
                          onClick={() => handleOpenModal(workspace)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(workspace._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingWorkspace ? "Edit Workspace" : "New Workspace"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Provide business details for the workspace</p>
              </div>
              <button onClick={() => setShowModal(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Workspace Name *</label>
                  <input name="name" type="text" required value={formData.name} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="e.g. Sales Team" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Business Name *</label>
                  <input name="businessName" type="text" required value={formData.businessName} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="Official business name" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Email Address *</label>
                  <input name="email" type="email" required value={formData.email} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="workspace@example.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Password {!editingWorkspace && "*"}</label>
                  <input name="password" type="password" required={!editingWorkspace} value={formData.password} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="••••••••" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Confirm Password {!editingWorkspace && "*"}</label>
                  <input name="confirmPassword" type="password" required={!editingWorkspace} value={formData.confirmPassword} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="••••••••" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Mobile Number *</label>
                  <input name="mobileNo" type="tel" required value={formData.mobileNo} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="9876543210" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Website URL</label>
                  <input name="websiteUrl" type="url" value={formData.websiteUrl} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="https://example.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">GST Number</label>
                  <input name="gstNo" type="text" value={formData.gstNo} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="GST123456789" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">PAN Number</label>
                  <input name="panNo" type="text" value={formData.panNo} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="ABCDE1234F" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">City *</label>
                  <input name="city" type="text" required value={formData.city} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="City name" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Pincode *</label>
                  <input name="pincode" type="text" required value={formData.pincode} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" placeholder="123456" />
                </div>
              </div>

              <div className="mt-6 space-y-1">
                <label className="text-sm font-bold text-gray-700">Address *</label>
                <textarea name="address" required value={formData.address} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none min-h-[80px]" placeholder="Full business address..." />
              </div>

              <div className="flex space-x-4 pt-8">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 font-bold transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : (editingWorkspace ? "Update Workspace" : "Create Workspace")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceManagement;
