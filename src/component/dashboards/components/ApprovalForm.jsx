import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../config";

function ApprovalForm() {
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    contactNumber: "",
    contactName: "",
    address: "",
    website: "",
    pancard: "",
    gst: "",
    annualTurnover: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);

    try {
      // Get the authentication token from sessionStorage
      const token = sessionStorage.getItem("clienttoken");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Make API call to create profile
      const response = await axios.post(
        `${API_BASE_URL}/auth/client/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSubmitted(true);
        setError("");
        // Optionally reset form or redirect
        console.log("Profile created successfully:", response.data);
      } else {
        throw new Error(response.data.message || "Failed to create profile");
      }
    } catch (err) {
      console.error("Profile creation error:", err);

      if (err.response?.status === 409) {
        setError(
          "Profile already exists. Please use the update endpoint to modify your existing profile."
        );
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center">
          <h1 className="m-0 text-3xl font-bold text-white tracking-tight">
            Business Approval Application
          </h1>
          <p className="mt-2 text-lg text-indigo-100 opacity-90">
            Please fill out all required fields to submit your application
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Business Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans"
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Business Type <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans"
                placeholder="e.g., Technology, Retail, Manufacturing"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Contact Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                pattern="[0-9]{10,15}"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans"
                placeholder="Enter 10-15 digit phone number"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Contact Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans"
                placeholder="Primary contact person name"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Business Address <span className="text-red-600">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans resize-y min-h-[80px]"
                placeholder="Enter complete business address"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Website <span className="text-red-600">*</span>
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans"
                placeholder="https://www.example.com"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                PAN Card Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="pancard"
                value={formData.pancard}
                onChange={handleChange}
                required
                maxLength="10"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans uppercase"
                placeholder="ABCDE1234F"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                GST Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="gst"
                value={formData.gst}
                onChange={handleChange}
                required
                maxLength="15"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans uppercase"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Annual Turnover (₹) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="annualTurnover"
                value={formData.annualTurnover}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans"
                placeholder="Enter annual turnover in rupees"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all font-sans tracking-wide focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 shadow-sm mt-2
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed opacity-70"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </button>

            {submitted && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-base font-semibold text-green-700 mb-1">
                  ✅ Application Submitted Successfully!
                </div>
                <div className="text-sm text-green-800">
                  We will review your application and get back to you within 2-3
                  business days.
                </div>
              </div>
            )}
            {error && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-center">
                <div className="text-base font-semibold text-yellow-800 mb-1">
                  ❌ Error:
                </div>
                <div className="text-sm text-yellow-800">{error}</div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ApprovalForm;
