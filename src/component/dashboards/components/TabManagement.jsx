import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaList, FaCheck, FaBan, FaArrowLeft } from "react-icons/fa";
import { API_BASE_URL } from "../../../config";

const TabManagement = ({ workspaceId, onBack }) => {
  const [workspace, setWorkspace] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTab, setEditingTab] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "FaChartBar",
    path: "",
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const token = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const ws = data.workspaces.find(w => w._id === workspaceId);
        if (ws) {
          setWorkspace(ws);
          setTabs(ws.tabs || []);
        }
      }
    } catch (error) {
      console.error("Error fetching workspace details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchWorkspace();
  }, [workspaceId]);

  const handleToggleActive = async (index) => {
    const updatedTabs = [...tabs];
    updatedTabs[index].isActive = !updatedTabs[index].isActive;
    saveTabs(updatedTabs);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Delete this tab?")) return;
    const updatedTabs = tabs.filter((_, i) => i !== index);
    saveTabs(updatedTabs);
  };

  const handleEdit = (tab, index) => {
    setEditingTab(index);
    setFormData({ ...tab });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updatedTabs = [...tabs];
    if (editingTab !== null) {
      updatedTabs[editingTab] = formData;
    } else {
      updatedTabs.push(formData);
    }
    saveTabs(updatedTabs);
    setShowForm(false);
    setEditingTab(null);
    setFormData({ name: "", icon: "FaChartBar", path: "", isActive: true });
  };

  const saveTabs = async (updatedTabs) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tabs: updatedTabs })
      });
      const data = await response.json();
      if (data.success) {
        setTabs(updatedTabs);
      } else {
        alert(data.message || "Failed to update tabs");
      }
    } catch (error) {
      console.error("Error saving tabs:", error);
      alert("Error saving tabs");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <FaArrowLeft />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Menu Configuration</h2>
            <p className="text-gray-500 text-sm">Workspace: <span className="font-semibold text-purple-600">{workspace?.name}</span></p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingTab(null);
            setFormData({ name: "", icon: "FaChartBar", path: "", isActive: true });
            setShowForm(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center transition-all shadow-md"
        >
          <FaPlus className="mr-2" /> Add Menu Item
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tab List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Menu Name</th>
                  <th className="px-6 py-4">Path</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tabs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                      <FaList className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      No custom menu items configured
                    </td>
                  </tr>
                ) : (
                  tabs.map((tab, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-lg mr-3 text-gray-500">
                            <FaList />
                          </div>
                          <span className="font-semibold text-gray-900">{tab.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tab.path || "/"}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(index)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            tab.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tab.isActive ? <><FaCheck className="inline mr-1" /> Active</> : <><FaBan className="inline mr-1" /> Disabled</>}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => handleEdit(tab, index)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDelete(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
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

        {/* Form Panel */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 h-fit sticky top-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editingTab !== null ? "Edit Menu Item" : "New Menu Item"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dashboard"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Route Path</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none font-mono text-sm"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/dashboard"
                />
              </div>
              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-5 w-5 text-purple-600 rounded-md focus:ring-0"
                  />
                  <span className="text-sm font-bold text-gray-700">Active</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center shadow-lg shadow-purple-200 disabled:opacity-50"
              >
                <FaSave className="mr-2" /> {isSaving ? "Saving..." : "Save Preferences"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabManagement;
