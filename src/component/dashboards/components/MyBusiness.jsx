import React, { useState, useEffect } from "react";
import {
  Upload,
  Link,
  FileText,
  DollarSign,
  Tag,
  Package,
  Image,
  Plus,
  X,
  IndianRupee,
} from "lucide-react";
import { API_BASE_URL } from "../../../config";

// Business Form Component
const BusinessForm = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    type: "product",
    image: { url: "", key: "" },
    documents: { url: "", key: "" },
    videoLink: "",
    description: "",
    mrp: "",
    offerPrice: "",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (fieldName === "image") {
        setPreviewImage(ev.target.result);
        setFormData((prev) => ({
          ...prev,
          image: { url: ev.target.result, key: "" },
        }));
      } else if (fieldName === "documents") {
        setFormData((prev) => ({
          ...prev,
          documents: { url: ev.target.result, key: "" },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("clienttoken");
      const payload = {
        ...formData,
        mrp: formData.mrp ? Number(formData.mrp) : 0,
        offerPrice: formData.offerPrice ? Number(formData.offerPrice) : null,
      };
      // Only send required fields for backend
      const requiredFields = [
        "title",
        "category",
        "type",
        "videoLink",
        "description",
        "image",
        "mrp",
      ];
      for (let field of requiredFields) {
        if (!payload[field] || (field === "image" && !payload.image.url)) {
          setError("All required fields must be filled.");
          setLoading(false);
          return;
        }
      }
      // Remove empty documents if not uploaded
      if (!payload.documents || !payload.documents.url) {
        delete payload.documents;
      }
      const res = await fetch(`${API_BASE_URL}/client/business`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        onCreated();
        handleReset();
        onClose();
      } else {
        setError(data.message || "Failed to create business.");
      }
    } catch (err) {
      setError("Error creating business.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: "",
      category: "",
      type: "product",
      image: { url: "", key: "" },
      documents: { url: "", key: "" },
      videoLink: "",
      description: "",
      mrp: "",
      offerPrice: "",
    });
    setPreviewImage(null);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Add Business Information
            </h2>
            <p className="text-gray-600 mt-1">
              Fill in the details for your product or service
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        {/* Modal Content */}
        <form className="p-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Package className="w-4 h-4 mr-2 text-blue-500" /> Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter the title"
                required
              />
            </div>
            {/* Category and Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Tag className="w-4 h-4 mr-2 text-green-500" /> Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Electronics, Consulting, etc."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Package className="w-4 h-4 mr-2 text-purple-500" /> Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                </select>
              </div>
            </div>
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Image className="w-4 h-4 mr-2 text-pink-500" /> Produce/Service
                Image *
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "image")}
                    accept="image/*"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                </div>
                {previewImage && (
                  <div className="w-20 h-20">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Video Link */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Link className="w-4 h-4 mr-2 text-red-500" /> Resources Link *
              </label>
              <input
                type="url"
                name="videoLink"
                value={formData.videoLink}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://...."
                required
              />
            </div>
            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                placeholder="Describe your product or service..."
                required
              />
            </div>
            {/* Price and Offer Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <IndianRupee className="w-4 h-4 mr-2 text-green-600" /> MRP
                </label>
                <input
                  type="number"
                  name="mrp"
                  value={formData.mrp}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Offer Price
                </label>
                <input
                  type="number"
                  name="offerPrice"
                  value={formData.offerPrice}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>
            {/* Error and Buttons */}
            {error && <div className="text-red-600 font-medium">{error}</div>}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? "Submitting..." : "Submit Form"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="sm:flex-none bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Reset Form
              </button>
              <button
                type="button"
                onClick={onClose}
                className="sm:flex-none bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Business Page Component
export default function BusinessPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBusinesses = async () => {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("clienttoken");
      const res = await fetch(`${API_BASE_URL}/client/business`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBusinesses(data.data);
      } else {
        setBusinesses([]);
        setError(data.message || "Failed to fetch businesses.");
      }
    } catch (err) {
      setError("Error fetching businesses.");
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);
  const handleCreated = () => fetchBusinesses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">My Business</h1>
          <p className="text-xl text-gray-600 mb-8">
            Manage your products and services with ease
          </p>
          {/* Create Button */}
          <button
            onClick={openForm}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Plus className="w-5 h-5 mr-2" /> Create New Item
          </button>
        </div>
        {/* Business Cards or Empty State */}
        {loading ? (
          <div className="text-center text-lg text-gray-600">
            Loading businesses...
          </div>
        ) : error ? (
          <div className="text-center text-red-600 font-medium">{error}</div>
        ) : businesses.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                No Business Information Yet
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Products</h3>
                  <p className="text-sm text-gray-600">
                    Add physical or digital products
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <Tag className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Services</h3>
                  <p className="text-sm text-gray-600">
                    List your professional services
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <Image className="w-8 h-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Media</h3>
                  <p className="text-sm text-gray-600">
                    Upload images and documents
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businesses.map((business) => (
              <div
                key={business._id}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4">
                  {business.image && (
                    <img
                      src={business.image.url}
                      alt={business.title}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {business.title}
                    </h3>
                    <div className="text-sm text-gray-600 mb-1">
                      {business.category} | {business.type}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(business.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 mb-2 line-clamp-3">
                    {business.description}
                  </p>
                  {business.videoLink && (
                    <a
                      href={business.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm"
                    >
                      Resource Link
                    </a>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-4">
                  {business.mrp !== undefined && (
                    <span className="text-lg font-semibold text-green-600">
                      ₹{business.offerPrice}
                    </span>
                  )}
                  {business.offerPrice && (
                    <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      MRP : {business.mrp}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Business Form Modal */}
      <BusinessForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onCreated={handleCreated}
      />
    </div>
  );
}
