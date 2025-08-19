import React, { useState, useEffect } from "react";
import {
  FiEdit,
  FiTrash2,
  FiVolume2,
  FiVolumeX,
  FiMicOff,
  FiSquare,
  FiUser,
  FiMessageSquare,
  FiTag,
  FiMoreVertical,
  FiMic,
  FiPhoneCall,
  FiX,
  FiSend,
  FiWifi,
  FiWifiOff,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";
import { QrCode } from "lucide-react";

import { API_BASE_URL } from "../../../config";
import AgentDetails from "./AgentDetails";
import AgentForm from "./AgentForm";
import QRCode from "qrcode";

// QR Code Logo Configuration
const QR_LOGO_CONFIG = {
  logoUrl: "/AitotaLogo.png",
  logoSize: 0.25,
};

// QR Code Component with Logo Support
const QRCodeDisplay = ({
  value,
  size = 200,
  bgColor = "#fff",
  fgColor = "#000",
  logoUrl = null,
  logoSize = 0.2,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!value) return;

    const generateQRWithLogo = async () => {
      try {
        if (logoUrl) {
          const qrDataUrl = await generateQRCodeWithLogo(
            value,
            size,
            bgColor,
            fgColor,
            logoUrl,
            logoSize
          );
          setQrDataUrl(qrDataUrl);
        } else {
          const qrDataUrl = await QRCode.toDataURL(value, {
            width: size,
            margin: 2,
            color: {
              dark: fgColor,
              light: bgColor,
            },
          });
          setQrDataUrl(qrDataUrl);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    generateQRWithLogo();
  }, [value, size, bgColor, fgColor, logoUrl, logoSize]);

  if (error) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <div
          className="flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4"
          style={{ width: size, height: size }}
        >
          <div className="text-2xl mb-2">📱</div>
          <div className="text-xs text-gray-600 text-center">QR Code Error</div>
          <div className="text-xs text-red-500 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {!qrDataUrl ? (
        <div
          className="flex items-center justify-center bg-gray-100 border rounded animate-pulse"
          style={{ width: size, height: size }}
        >
          <span className="text-xs text-gray-500">Generating QR...</span>
        </div>
      ) : (
        <img
          src={qrDataUrl || "/placeholder.svg"}
          alt="QR Code"
          width={size}
          height={size}
          className="border rounded-lg shadow-sm"
        />
      )}
    </div>
  );
};

// Function to generate QR code with logo overlay
const generateQRCodeWithLogo = async (
  text,
  size,
  bgColor,
  fgColor,
  logoUrl,
  logoSize = 0.2
) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = size;
      canvas.height = size;

      QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      })
        .then((qrDataUrl) => {
          const qrImage = new Image();
          qrImage.onload = () => {
            ctx.drawImage(qrImage, 0, 0, size, size);

            const logoImage = new Image();
            logoImage.onload = () => {
              const logoWidth = size * logoSize;
              const logoHeight = size * logoSize;

              const logoX = (size - logoWidth) / 2;
              const logoY = (size - logoHeight) / 2;

              const logoRadius = logoWidth / 2;
              ctx.save();
              ctx.beginPath();
              ctx.arc(
                logoX + logoRadius,
                logoY + logoRadius,
                logoRadius,
                0,
                2 * Math.PI
              );
              ctx.fillStyle = bgColor;
              ctx.fill();
              ctx.restore();

              ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

              const finalDataUrl = canvas.toDataURL("image/png");
              resolve(finalDataUrl);
            };

            logoImage.onerror = () => {
              resolve(qrDataUrl);
            };

            logoImage.src = logoUrl;
          };

          qrImage.onerror = () => {
            reject(new Error("Failed to generate QR code"));
          };

          qrImage.src = qrDataUrl;
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

function StaffAgents() {
  const [assignedAgent, setAssignedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [playingAgentId, setPlayingAgentId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedAgentForQR, setSelectedAgentForQR] = useState(null);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showAgentForm, setShowAgentForm] = useState(false);

  // Get token: prefer sessionStorage for both, fallback to legacy localStorage
  const getClientToken = () => {
    return (
      sessionStorage.getItem("clienttoken") ||
      sessionStorage.getItem("usertoken") ||
      localStorage.getItem("usertoken")
    );
  };

  // Resolve clientId from assignedAgent or session storage
  const getResolvedClientId = () => {
    if (assignedAgent?.clientId) return assignedAgent.clientId;
    try {
      const raw = sessionStorage.getItem("clientData");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.clientId) return parsed.clientId;
      }
    } catch (e) {}
    return "";
  };

  // Fetch assigned agent (refactor for reuse)
  const fetchAssignedAgentData = async () => {
    try {
      setLoading(true);
      const token = getClientToken();

      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/client/staff/agent`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError("No agent assigned to you");
        } else {
          throw new Error(`Failed to fetch agent: ${response.status}`);
        }
      } else {
        const data = await response.json();
        setAssignedAgent(data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAssignedAgentData();
  }, []);

  const formatPersonality = (personality) => {
    return personality
      ? personality.charAt(0).toUpperCase() + personality.slice(1)
      : "Not specified";
  };

  const getAgentColor = (index = 0) => {
    const colors = [
      "from-blue-700 to-blue-900",
      "from-purple-700 to-purple-900",
      "from-green-700 to-green-900",
      "from-red-700 to-red-900",
      "from-yellow-700 to-yellow-900",
    ];
    return colors[index % colors.length];
  };

  const playAudio = async (agentId) => {
    try {
      const token = getClientToken();
      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agentId}/audio?clientId=${
          assignedAgent?.clientId || ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setPlayingAgentId(agentId);

        const audio = new Audio(url);
        audio.onended = () => {
          stopAudio();
        };
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
          stopAudio();
        });
      } else {
        setAudioUrl(null);
        setPlayingAgentId(null);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setAudioUrl(null);
      setPlayingAgentId(null);
    }
  };

  const stopAudio = () => {
    if (audioUrl) {
      const audioElements = document.querySelectorAll("audio");
      audioElements.forEach((audio) => {
        if (audio.src === audioUrl) {
          audio.pause();
          audio.currentTime = 0;
        }
      });

      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setPlayingAgentId(null);
  };

  const toggleMenu = (agentId) => {
    setOpenMenuId(openMenuId === agentId ? null : agentId);
  };

  const handleViewDetails = (agent) => {
    setSelectedAgent(agent);
    setIsDetailsOpen(true);
    setOpenMenuId(null);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedAgent(null);
  };

  // QR Code Functions
  const handleShowQR = (agent) => {
    setSelectedAgentForQR(agent);
    setShowQRModal(true);
    setOpenMenuId(null);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedAgentForQR(null);
  };

  // Create Agent flow
  const openCreateAgentModal = () => setShowCreateAgentModal(true);
  const closeCreateAgentModal = () => setShowCreateAgentModal(false);
  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setShowCreateAgentModal(false);
    setShowAgentForm(true);
  };

  const downloadQRCode = async () => {
    if (!selectedAgentForQR) return;

    try {
      const qrUrl = `${window.location.origin}/agent/${selectedAgentForQR._id}/talk`;

      const logoUrl = QR_LOGO_CONFIG.logoUrl;

      let qrDataUrl;
      if (logoUrl) {
        qrDataUrl = await generateQRCodeWithLogo(
          qrUrl,
          512,
          "#fff",
          "#000",
          logoUrl,
          QR_LOGO_CONFIG.logoSize
        );
      } else {
        qrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 512,
          margin: 2,
          color: {
            dark: "#000",
            light: "#fff",
          },
        });
      }

      const link = document.createElement("a");
      link.download = `${selectedAgentForQR.agentName}-QR-Code.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(
        `QR Code for ${selectedAgentForQR.agentName} downloaded successfully!`
      );
    } catch (error) {
      console.error("Error downloading QR code:", error);
      alert("Failed to download QR code. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="text-center">
          <FiLoader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your assigned agent...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-16 px-8 bg-gradient-to-br from-red-50 to-white rounded-xl shadow-sm border border-red-100">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            No Agent Assigned
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (!assignedAgent) {
    return (
      <div className="w-full text-center py-16 px-8 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUser className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Agent Found
          </h3>
          <p className="text-gray-500">
            You don't have any agents assigned to you at the moment.
          </p>
          <div className="mt-6">
            <button
              onClick={openCreateAgentModal}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Agent
            </button>
          </div>
        </div>

        {/* Provider Selection Modal */}
        {showCreateAgentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
                <h3 className="text-lg font-semibold m-0">
                  Select Service Provider
                </h3>
                <button
                  onClick={closeCreateAgentModal}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleProviderSelect("c-zentrix")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-semibold text-gray-800">C-Zentrix</div>
                  <div className="text-sm text-gray-500">
                    Create agent with C-Zentrix
                  </div>
                </button>
                <button
                  onClick={() => handleProviderSelect("tata")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-semibold text-gray-800">TATA</div>
                  <div className="text-sm text-gray-500">
                    Create agent with TATA (no Account SID or Caller ID
                    required)
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Form Modal */}
        {showAgentForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-auto">
              <div className="bg-gradient-to-r from-gray-800 to-black px-6 py-4 text-white flex items-center justify-between">
                <h3 className="text-lg font-semibold m-0">
                  Create Agent (
                  {selectedProvider === "tata" ? "TATA" : "C-Zentrix"})
                </h3>
                <button
                  onClick={() => setShowAgentForm(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4">
                <AgentForm
                  agent={null}
                  onSave={() => {
                    setShowAgentForm(false);
                    setSelectedProvider(null);
                    fetchAssignedAgentData();
                  }}
                  onCancel={() => {
                    setShowAgentForm(false);
                    setSelectedProvider(null);
                  }}
                  clientId={getResolvedClientId()}
                  initialServiceProvider={selectedProvider}
                  lockServiceProvider={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top actions */}
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreateAgentModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Agent
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Agent Card */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden cursor-pointer relative"
          onClick={() => handleViewDetails(assignedAgent)}
        >
          {/* Active Status Indicator */}
          <div
            className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
              assignedAgent.isActive !== false ? "bg-green-500" : "bg-red-500"
            } z-10`}
            title={
              assignedAgent.isActive !== false
                ? "Agent is Active"
                : "Agent is Inactive"
            }
          />

          {/* Header */}
          <div className={`bg-gradient-to-r ${getAgentColor(0)} px-6 py-4`}>
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold text-lg truncate capitalize">
                {assignedAgent.agentName}
              </h3>
              <div className="flex items-center gap-2">
                {/* QR Code Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowQR(assignedAgent);
                  }}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Show QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                {/* More Options Button */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(assignedAgent._id);
                    }}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="More options"
                  >
                    <FiMoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === assignedAgent._id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(assignedAgent);
                        }}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* First Message */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiMessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      First Message
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (playingAgentId === assignedAgent._id && audioUrl) {
                          stopAudio();
                        } else {
                          playAudio(assignedAgent._id);
                        }
                      }}
                      className="inline-flex items-center justify-center p-1 transition-colors duration-200 hover:scale-110 flex-shrink-0"
                      title={
                        playingAgentId === assignedAgent._id && audioUrl
                          ? "Stop Audio"
                          : "Play Audio"
                      }
                    >
                      {playingAgentId === assignedAgent._id && audioUrl ? (
                        <FiVolumeX className="w-4 h-4 text-red-500" />
                      ) : (
                        <FiVolume2 className="w-4 h-4 text-gray-600 hover:text-gray-800" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-medium text-gray-800 flex-1">
                      {assignedAgent.firstMessage || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiTag className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Category
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    {assignedAgent.category || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiUser className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Personality
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    {formatPersonality(assignedAgent.personality)}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Description
              </label>
              <p className="text-gray-600 text-sm leading-relaxed italic">
                "{assignedAgent.description || "No description available"}"
              </p>
            </div>

            {/* Status Info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assignedAgent.isActive !== false
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {assignedAgent.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details are shown only via AgentDetails modal when card is clicked */}

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedAgentForQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    QR Code - {selectedAgentForQR.agentName}
                  </h3>
                  <p className="text-sm opacity-90">
                    {selectedAgentForQR.category}
                  </p>
                </div>
                <button
                  onClick={closeQRModal}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* QR Code Content */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <QRCodeDisplay
                  value={`${window.location.origin}/agent/${selectedAgentForQR._id}/talk`}
                  size={250}
                  bgColor="#fff"
                  fgColor="#000"
                  logoUrl={QR_LOGO_CONFIG.logoUrl}
                  logoSize={QR_LOGO_CONFIG.logoSize}
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">
                  Scan to Talk with AI Agent - {selectedAgentForQR.agentName}
                </h4>
                <p className="text-gray-600 text-sm">
                  Scan this QR code with your mobile device to start a voice
                  conversation with {selectedAgentForQR.agentName}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3 justify-center">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  Download QR
                </button>
                <button
                  onClick={closeQRModal}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Details Modal */}
      <AgentDetails
        agent={selectedAgent}
        isOpen={isDetailsOpen}
        onClose={closeDetails}
        clientId={assignedAgent?.clientId}
        onEdit={() => {}} // No edit functionality for staff
      />

      {/* Provider Selection Modal */}
      {showCreateAgentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-semibold m-0">
                Select Service Provider
              </h3>
              <button
                onClick={closeCreateAgentModal}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 gap-4">
              <button
                onClick={() => handleProviderSelect("c-zentrix")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-semibold text-gray-800">C-Zentrix</div>
                <div className="text-sm text-gray-500">
                  Create agent with C-Zentrix
                </div>
              </button>
              <button
                onClick={() => handleProviderSelect("tata")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-semibold text-gray-800">TATA</div>
                <div className="text-sm text-gray-500">
                  Create agent with TATA (no Account SID or Caller ID required)
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Form Modal */}
      {showAgentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-r from-gray-800 to-black px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-semibold m-0">
                Create Agent (
                {selectedProvider === "tata" ? "TATA" : "C-Zentrix"})
              </h3>
              <button
                onClick={() => setShowAgentForm(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <AgentForm
                agent={null}
                onSave={() => {
                  setShowAgentForm(false);
                  setSelectedProvider(null);
                  fetchAssignedAgentData();
                }}
                onCancel={() => {
                  setShowAgentForm(false);
                  setSelectedProvider(null);
                }}
                clientId={getResolvedClientId()}
                initialServiceProvider={selectedProvider}
                lockServiceProvider={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffAgents;
