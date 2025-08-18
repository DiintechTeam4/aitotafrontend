import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
import {
  Package,
  Tag,
  Image,
  VideoIcon,
  Link,
  IndianRupee,
  Calendar,
  ArrowLeft,
} from "lucide-react";

const PublicBusinessDetails = () => {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Extract business identifier from the slug
        const hash = slug.match(/[a-f0-9]{8}$/)?.[0];
        const objectId = slug.match(/[a-f0-9]{24}$/)?.[0];

        if (!hash && !objectId) {
          setError("Invalid business link");
          setLoading(false);
          return;
        }

        const identifier = hash || objectId;

        const response = await fetch(
          `${API_BASE_URL}/public/business/${identifier}`
        );
        const data = await response.json();

        if (data.success) {
          setBusiness(data.data);
        } else {
          setError(data.message || "Business not found");
        }
      } catch (err) {
        console.error("Error fetching business details:", err);
        setError("Failed to load business details");
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md mx-4">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Business</h3>
          <p className="text-slate-600">Retrieving business details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-lg mx-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center shadow-inner">
            <Package className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            Business Not Found
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed">{error}</p>
          <div className="h-1 w-16 bg-gradient-to-r from-red-400 to-rose-400 mx-auto rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-white/50">
            {/* Hero Section */}
            <div className="relative">
              <div className="flex flex-col lg:flex-row h-auto lg:h-80">
                {/* Left Side - Image */}
                <div className="flex-1 relative group">
                  {business.image &&
                  business.image.url &&
                  business.image.url.trim() !== "" ? (
                    <div className="relative overflow-hidden h-64 lg:h-full">
                      <img
                        src={business.image.url}
                        alt={business.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="w-full h-64 lg:h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center relative overflow-hidden">
                      <Image className="w-20 h-20 text-white opacity-60" />
                    </div>
                  )}
                </div>

                {/* Right Side - Title and Badges */}
                <div className="flex-1 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col justify-center px-8 sm:px-12 py-8 lg:py-12 relative overflow-hidden">
                  <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight tracking-tight">
                      {business.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8">
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold border border-white/30 hover:bg-white/30 transition-all duration-300">
                        <Tag className="w-4 h-4 inline mr-2" />
                        {business.category}
                      </span>
                      <span className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-full text-sm capitalize font-semibold shadow-lg">
                        <Package className="w-4 h-4 inline mr-2" />
                        {business.type}
                      </span>
                    </div>
                    
                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300/50">
                      Contact Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 sm:p-8 lg:p-12">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
                {/* Main Content */}
                <div className="xl:col-span-2">
                  <div className="space-y-8">
                    {/* Description */}
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 sm:p-8 border border-slate-200/50">
                      <div className="flex items-center mb-4">
                        <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full mr-4"></div>
                        <h3 className="text-2xl font-bold text-slate-800">
                          About This Business
                        </h3>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-base sm:text-lg font-medium">
                        {business.description}
                      </p>
                    </div>

                    {/* Links */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-slate-800 mb-4">Resources & Links</h3>
                      
                      {business.videoLink && (
                        <div className="group">
                          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-200/50 hover:shadow-lg hover:shadow-red-100 transition-all duration-300 hover:scale-[1.02]">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                              <VideoIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <a
                                href={business.videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-700 hover:text-red-800 font-bold text-lg transition-colors duration-300"
                              >
                                Watch Video Presentation
                              </a>
                              <p className="text-red-600 text-sm font-medium">Click to view in new tab</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {business.link && (
                        <div className="group">
                          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 hover:scale-[1.02]">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                              <Link className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <a
                                href={business.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-800 font-bold text-lg transition-colors duration-300"
                              >
                                View Additional Resources
                              </a>
                              <p className="text-blue-600 text-sm font-medium">External link opens in new tab</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Pricing */}
                  {(business.mrp !== undefined || business.offerPrice) && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 sm:p-8 border border-green-200/50 shadow-lg">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                          <IndianRupee className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">
                          Pricing Details
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {business.offerPrice && (
                          <div className="bg-white rounded-xl p-4 shadow-inner border border-green-200/50">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 font-semibold">
                                Special Offer:
                              </span>
                              <div className="text-right">
                                <span className="text-3xl font-bold text-green-600 block">
                                  ₹{business.offerPrice}
                                </span>
                                <span className="text-green-700 text-sm font-medium">Best Price</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {business.mrp !== undefined && (
                          <div className="bg-white rounded-xl p-4 shadow-inner border border-slate-200/50">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 font-semibold">
                                Regular Price:
                              </span>
                              <span className="text-xl text-slate-500 line-through font-bold">
                                ₹{business.mrp}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {business.offerPrice && business.mrp !== undefined && business.mrp > business.offerPrice && (
                          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border border-green-300/50">
                            <div className="text-center">
                              <span className="text-green-700 font-bold text-lg">
                                Save ₹{business.mrp - business.offerPrice}
                              </span>
                              <div className="text-green-600 text-sm font-medium">
                                ({Math.round(((business.mrp - business.offerPrice) / business.mrp) * 100)}% OFF)
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Business Info */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 sm:p-8 border border-slate-200/50 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center mr-3">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      Business Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-300">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Tag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-slate-500 text-sm font-medium">Category</p>
                          <p className="text-slate-800 font-bold">{business.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-300">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-slate-500 text-sm font-medium">Type</p>
                          <p className="text-slate-800 font-bold capitalize">{business.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-300">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-slate-500 text-sm font-medium">Listed Since</p>
                          <p className="text-slate-800 font-bold">
                            {new Date(business.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBusinessDetails;