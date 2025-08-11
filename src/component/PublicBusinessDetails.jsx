import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
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
        // The slug format can be: {title-slug}-{hash} or {title-slug}{objectId}
        // We need to extract the identifier from the end
        const hash = slug.match(/[a-f0-9]{8}$/)?.[0];
        const objectId = slug.match(/[a-f0-9]{24}$/)?.[0];

        if (!hash && !objectId) {
          setError("Invalid business link");
          setLoading(false);
          return;
        }

        // Use hash if available, otherwise fallback to ObjectId
        const identifier = hash || objectId;

        // Call the public API endpoint
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Business Not Found
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">

        {/* Business Details Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            {/* Hero Section */}
            <div className="relative h-48 sm:h-64 bg-gradient-to-r from-blue-600 to-purple-600">
              {business.image && business.image.url ? (
                <img
                  src={business.image.url}
                  alt={business.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-16 h-16 text-white opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
                  {business.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white">
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs sm:text-sm">
                    {business.category}
                  </span>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs sm:text-sm capitalize">
                    {business.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                        Description
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        {business.description}
                      </p>
                    </div>

                    {/* Links */}
                    <div className="space-y-3 sm:space-y-4">
                      {business.videoLink && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-red-50 rounded-lg">
                          <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                          <a
                            href={business.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-700 font-medium text-sm sm:text-base"
                          >
                            Watch Video
                          </a>
                        </div>
                      )}

                      {business.link && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
                          <Link className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                          <a
                            href={business.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
                          >
                            View Resource
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Pricing */}
                  {(business.mrp !== undefined || business.offerPrice) && (
                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                        Pricing
                      </h3>
                      <div className="space-y-2 sm:space-y-3">
                        {business.offerPrice && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm sm:text-base">
                              Offer Price:
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-green-600">
                              ₹{business.offerPrice}
                            </span>
                          </div>
                        )}
                        {business.mrp !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm sm:text-base">
                              MRP:
                            </span>
                            <span className="text-base sm:text-lg text-gray-800 line-through">
                              ₹{business.mrp}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Business Info */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                      Business Info
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm sm:text-base">
                          {business.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 capitalize text-sm sm:text-base">
                          {business.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm sm:text-base">
                          {new Date(business.createdAt).toLocaleDateString()}
                        </span>
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
