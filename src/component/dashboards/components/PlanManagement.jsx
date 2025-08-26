import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../config";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaCopy,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaFilter,
  FaSort,
  FaChartBar,
  FaDollarSign,
  FaUsers,
  FaStar,
  FaTimes,
  FaCheck,
  FaExclamationTriangle
} from "react-icons/fa";

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortOrder, setSortOrder] = useState("asc");
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "basic",
    price: 0,
    currency: "USD",
    billingCycle: "monthly",
    creditsIncluded: 0,
    bonusCredits: 0,
    usageRates: {
      callPerMinute: 1,
      whatsappMessage: 1,
      telegramMessage: 1,
      emailMessage: 1,
      smsMessage: 1
    },
    features: {
      maxAgents: 1,
      maxCampaigns: 1,
      maxContacts: 100,
      voiceCalls: true,
      whatsappIntegration: false,
      telegramIntegration: false,
      emailIntegration: false,
      smsIntegration: false,
      analytics: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false
    },
    discounts: {
      monthlyDiscount: 0,
      quarterlyDiscount: 0,
      yearlyDiscount: 0
    },
    limits: {
      maxCallsPerDay: 100,
      maxMessagesPerDay: 1000,
      maxStorageGB: 1
    },
    isActive: true,
    isPopular: false,
    sortOrder: 0
  });

  useEffect(() => {
    fetchPlans();
    fetchStats();
  }, [currentPage, searchTerm, filterCategory, filterStatus, sortBy, sortOrder]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admintoken");
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterStatus && { isActive: filterStatus })
      });

      const response = await fetch(`${API_BASE_URL}/admin/plans?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admintoken");
      const response = await fetch(`${API_BASE_URL}/admin/plans/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admintoken");
      const url = editingPlan 
        ? `${API_BASE_URL}/admin/plans/${editingPlan._id}`
        : `${API_BASE_URL}/admin/plans`;
      
      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingPlan(null);
        resetForm();
        fetchPlans();
        alert(editingPlan ? "Plan updated successfully!" : "Plan created successfully!");
      } else {
        alert(data.message || "Error saving plan");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Error saving plan");
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;

    try {
      const token = localStorage.getItem("admintoken");
      const response = await fetch(`${API_BASE_URL}/admin/plans/${planId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchPlans();
        alert("Plan deleted successfully!");
      } else {
        alert(data.message || "Error deleting plan");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("Error deleting plan");
    }
  };

  const handleToggleStatus = async (planId) => {
    try {
      const token = localStorage.getItem("admintoken");
      const response = await fetch(`${API_BASE_URL}/admin/plans/${planId}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchPlans();
      } else {
        alert(data.message || "Error toggling plan status");
      }
    } catch (error) {
      console.error("Error toggling plan status:", error);
      alert("Error toggling plan status");
    }
  };

  const handleDuplicate = async (planId) => {
    try {
      const token = localStorage.getItem("admintoken");
      const response = await fetch(`${API_BASE_URL}/admin/plans/${planId}/duplicate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchPlans();
        alert("Plan duplicated successfully!");
      } else {
        alert(data.message || "Error duplicating plan");
      }
    } catch (error) {
      console.error("Error duplicating plan:", error);
      alert("Error duplicating plan");
    }
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      category: plan.category,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      creditsIncluded: plan.creditsIncluded,
      bonusCredits: plan.bonusCredits,
      usageRates: plan.usageRates,
      features: plan.features,
      discounts: plan.discounts,
      limits: plan.limits,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "basic",
      price: 0,
      currency: "USD",
      billingCycle: "monthly",
      creditsIncluded: 0,
      bonusCredits: 0,
      usageRates: {
        callPerMinute: 1,
        whatsappMessage: 1,
        telegramMessage: 1,
        emailMessage: 1,
        smsMessage: 1
      },
      features: {
        maxAgents: 1,
        maxCampaigns: 1,
        maxContacts: 100,
        voiceCalls: true,
        whatsappIntegration: false,
        telegramIntegration: false,
        emailIntegration: false,
        smsIntegration: false,
        analytics: false,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false
      },
      discounts: {
        monthlyDiscount: 0,
        quarterlyDiscount: 0,
        yearlyDiscount: 0
      },
      limits: {
        maxCallsPerDay: 100,
        maxMessagesPerDay: 1000,
        maxStorageGB: 1
      },
      isActive: true,
      isPopular: false,
      sortOrder: 0
    });
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
          <p className="text-gray-600">Create and manage subscription plans</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Create Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FaChartBar className="text-blue-600 text-2xl" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold">{stats.totalPlans || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FaCheck className="text-green-600 text-2xl" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold">{stats.activePlans || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FaStar className="text-yellow-600 text-2xl" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Popular Plans</p>
              <p className="text-2xl font-bold">{stats.popularPlans || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FaUsers className="text-purple-600 text-2xl" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Subscribers</p>
              <p className="text-2xl font-bold">
                {stats.planUsage?.reduce((sum, plan) => sum + plan.subscribers, 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="basic">Basic</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
            <option value="custom">Custom</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="sortOrder-asc">Sort by Order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading plans...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits & Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Features
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map((plan) => (
                    <tr key={plan._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {plan.name}
                            </h3>
                            {plan.isPopular && (
                              <FaStar className="ml-2 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            plan.category === 'basic' ? 'bg-blue-100 text-blue-800' :
                            plan.category === 'professional' ? 'bg-green-100 text-green-800' :
                            plan.category === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {plan.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${plan.price}
                          </p>
                          <p className="text-sm text-gray-600">
                            {plan.billingCycle} • {plan.currency}
                          </p>
                          {plan.discounts[`${plan.billingCycle}Discount`] > 0 && (
                            <p className="text-xs text-green-600">
                              {plan.discounts[`${plan.billingCycle}Discount`]}% off
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {plan.creditsIncluded + plan.bonusCredits} credits
                          </p>
                          <p className="text-xs text-gray-600">
                            {plan.bonusCredits > 0 && `+${plan.bonusCredits} bonus`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {plan.usageRates.callPerMinute} credit/min call
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <p>• {plan.features.maxAgents} agents</p>
                          <p>• {plan.features.maxCampaigns} campaigns</p>
                          <p>• {plan.features.maxContacts} contacts</p>
                          {plan.features.analytics && <p>• Analytics</p>}
                          {plan.features.prioritySupport && <p>• Priority Support</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            plan.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(plan)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDuplicate(plan._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Duplicate"
                          >
                            <FaCopy />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(plan._id)}
                            className={plan.isActive ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}
                            title={plan.isActive ? "Deactivate" : "Activate"}
                          >
                            {plan.isActive ? <FaToggleOn /> : <FaToggleOff />}
                          </button>
                          <button
                            onClick={() => handleDelete(plan._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingPlan ? "Edit Plan" : "Create New Plan"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {/* Credits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Credits Included</label>
                  <input
                    type="number"
                    value={formData.creditsIncluded}
                    onChange={(e) => setFormData({...formData, creditsIncluded: parseInt(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bonus Credits</label>
                  <input
                    type="number"
                    value={formData.bonusCredits}
                    onChange={(e) => setFormData({...formData, bonusCredits: parseInt(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
              </div>

              {/* Usage Rates */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Usage Rates (Credits per action)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Call per minute</label>
                    <input
                      type="number"
                      value={formData.usageRates.callPerMinute}
                      onChange={(e) => setFormData({
                        ...formData, 
                        usageRates: {...formData.usageRates, callPerMinute: parseFloat(e.target.value)}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">WhatsApp message</label>
                    <input
                      type="number"
                      value={formData.usageRates.whatsappMessage}
                      onChange={(e) => setFormData({
                        ...formData, 
                        usageRates: {...formData.usageRates, whatsappMessage: parseFloat(e.target.value)}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email message</label>
                    <input
                      type="number"
                      value={formData.usageRates.emailMessage}
                      onChange={(e) => setFormData({
                        ...formData, 
                        usageRates: {...formData.usageRates, emailMessage: parseFloat(e.target.value)}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Agents</label>
                    <input
                      type="number"
                      value={formData.features.maxAgents}
                      onChange={(e) => setFormData({
                        ...formData, 
                        features: {...formData.features, maxAgents: parseInt(e.target.value)}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Campaigns</label>
                    <input
                      type="number"
                      value={formData.features.maxCampaigns}
                      onChange={(e) => setFormData({
                        ...formData, 
                        features: {...formData.features, maxCampaigns: parseInt(e.target.value)}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Contacts</label>
                    <input
                      type="number"
                      value={formData.features.maxContacts}
                      onChange={(e) => setFormData({
                        ...formData, 
                        features: {...formData.features, maxContacts: parseInt(e.target.value)}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Feature Toggles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData.features).filter(([key]) => typeof formData.features[key] === 'boolean').map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={key}
                        checked={value}
                        onChange={(e) => setFormData({
                          ...formData, 
                          features: {...formData.features, [key]: e.target.checked}
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={key} className="ml-2 block text-sm text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPopular" className="ml-2 block text-sm text-gray-900">
                    Popular
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;
