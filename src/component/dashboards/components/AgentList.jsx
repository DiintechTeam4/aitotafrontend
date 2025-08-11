"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiEdit,
  FiTrash2,
  FiVolume2,
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
} from "react-icons/fi";
import { QrCode } from 'lucide-react';

import { API_BASE_URL } from "../../../config";
import AgentDetails from "./AgentDetails";
import QRCode from "qrcode";

// QR Code Component
const QRCodeDisplay = ({ value, size = 200, bgColor = "#fff", fgColor = "#000" }) => {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then(setQrDataUrl)
      .catch((err) => setError(err.message));
  }, [value, size, bgColor, fgColor]);

  if (error) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4" style={{ width: size, height: size }}>
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
        <div className="flex items-center justify-center bg-gray-100 border rounded animate-pulse" style={{ width: size, height: size }}>
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

const AgentList = ({ agents, onEdit, onDelete, clientId }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [playingAgentId, setPlayingAgentId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [agentStates, setAgentStates] = useState({});

  // QR Code Modal States
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedAgentForQR, setSelectedAgentForQR] = useState(null);

  // Voice Chat Modal States
  const [showVoiceChatModal, setShowVoiceChatModal] = useState(false);
  const [voiceChatMessages, setVoiceChatMessages] = useState([]);
  const [currentVoiceMessage, setCurrentVoiceMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [selectedAgentForChat, setSelectedAgentForChat] = useState(null);

  // Call Modal States
  const [showCallModal, setShowCallModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [callStage, setCallStage] = useState("input"); // input, connecting, connected
  const [callDuration, setCallDuration] = useState(0);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [callMessages, setCallMessages] = useState([]);
  const [currentCallMessage, setCurrentCallMessage] = useState("");
  const [isCallRecording, setIsCallRecording] = useState(false);
  const [callMicLevel, setCallMicLevel] = useState(0);
  const [selectedAgentForCall, setSelectedAgentForCall] = useState(null);

  // Refs for audio handling
  const micIntervalRef = useRef(null);
  const callTimerRef = useRef(null);
  const callMicIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize agent states
  useEffect(() => {
    if (agents && agents.length > 0) {
      const initialStates = {};
      agents.forEach(agent => {
        initialStates[agent._id] = {
          isActive: agent.isActive !== undefined ? agent.isActive : true,
          isToggling: false
        };
      });
      setAgentStates(initialStates);
    }
  }, [agents]);

  const formatPersonality = (personality) => {
    return personality.charAt(0).toUpperCase() + personality.slice(1);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Generate different colors for each agent
  const getAgentColor = (index) => {
    const colors = [
      "from-blue-700 to-blue-900",
      "from-purple-700 to-purple-900",
      "from-green-700 to-green-900",
      "from-red-700 to-red-900",
      "from-yellow-700 to-yellow-900",
      "from-pink-700 to-pink-900",
      "from-indigo-700 to-indigo-900",
      "from-teal-700 to-teal-900",
      "from-orange-700 to-orange-900",
      "from-cyan-700 to-cyan-900",
    ];
    return colors[index % colors.length];
  };

  // Toggle Active Status Function
  const toggleActiveStatus = async (agent, e) => {
    e.stopPropagation();
    
    const currentState = agentStates[agent._id];
    if (currentState?.isToggling) return; // Prevent multiple requests

    try {
      // Set toggling state
      setAgentStates(prev => ({
        ...prev,
        [agent._id]: {
          ...prev[agent._id],
          isToggling: true
        }
      }));

      const newActiveStatus = !currentState?.isActive;
      
      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agent._id}/toggle-active?clientId=${clientId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
          body: JSON.stringify({
            isActive: newActiveStatus
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setAgentStates(prev => ({
          ...prev,
          [agent._id]: {
            isActive: newActiveStatus,
            isToggling: false
          }
        }));

        // Show success message
        const statusText = newActiveStatus ? 'activated' : 'deactivated';
        console.log(`Agent ${agent.agentName} ${statusText} successfully`);
        
      } else {
        throw new Error(`Failed to toggle agent status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error toggling agent status:', error);
      
      // Reset toggling state on error
      setAgentStates(prev => ({
        ...prev,
        [agent._id]: {
          ...prev[agent._id],
          isToggling: false
        }
      }));
      
      alert(`Failed to toggle agent status. Please try again.`);
    }
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

  // Download QR Code function
  const downloadQRCode = async () => {
    if (!selectedAgentForQR) return;
    
    try {
      const qrUrl = `${window.location.origin}/agent/${selectedAgentForQR._id}/talk`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: "#000",
          light: "#fff",
        },
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${selectedAgentForQR.agentName}-QR-Code.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      alert(`QR Code for ${selectedAgentForQR.agentName} downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  const playAudio = async (agentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agentId}/audio?clientId=${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
        }
      );
      if (response.ok) {
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setPlayingAgentId(agentId);
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
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setPlayingAgentId(null);
  };

  const toggleMenu = (agentId) => {
    setOpenMenuId(openMenuId === agentId ? null : agentId);
  };

  const handleEdit = (agent) => {
    setOpenMenuId(null);
    onEdit(agent);
  };

  const handleDelete = (agentId) => {
    setOpenMenuId(null);
    onDelete(agentId);
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

  // Voice Chat Functions
  const handleVoiceChat = (agent) => {
    setSelectedAgentForChat(agent);
    setShowVoiceChatModal(true);
    setOpenMenuId(null);
    // Add initial AI message
    setVoiceChatMessages([
      {
        id: 1,
        type: "ai",
        message:
          agent.firstMessage ||
          "Hello! I'm here to help you. How can I assist you today?",
        timestamp: new Date(),
      },
    ]);
  };

  const startVoiceRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current =
        audioContextRef.current.createMediaStreamSource(stream);

      // Connect microphone to analyzer
      microphoneRef.current.connect(analyserRef.current);

      // Configure analyzer
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      setIsRecording(true);

      // Start analyzing microphone input
      const updateMicLevel = () => {
        if (!isRecording) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;

        // Convert to percentage (0-100)
        const level = Math.min(100, (average / 255) * 100 * 3); // Multiply by 3 for better sensitivity
        setMicLevel(level);

        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      };

      updateMicLevel();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check permissions.");
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    setMicLevel(0);

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop microphone stream
    if (microphoneRef.current && microphoneRef.current.mediaStream) {
      microphoneRef.current.mediaStream
        .getTracks()
        .forEach((track) => track.stop());
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset refs
    analyserRef.current = null;
    microphoneRef.current = null;
    dataArrayRef.current = null;

    // Simulate processing and add message
    setTimeout(() => {
      const newMessage = {
        id: voiceChatMessages.length + 1,
        type: "human",
        message: "This is a voice message I just recorded.",
        timestamp: new Date(),
      };
      setVoiceChatMessages((prev) => [...prev, newMessage]);

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: voiceChatMessages.length + 2,
          type: "ai",
          message: "I heard your voice message. How can I assist you further?",
          timestamp: new Date(),
        };
        setVoiceChatMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }, 1000);
  };

  const sendVoiceMessage = () => {
    if (currentVoiceMessage.trim()) {
      const newMessage = {
        id: voiceChatMessages.length + 1,
        type: "human",
        message: currentVoiceMessage,
        timestamp: new Date(),
      };
      setVoiceChatMessages((prev) => [...prev, newMessage]);
      setCurrentVoiceMessage("");

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: voiceChatMessages.length + 2,
          type: "ai",
          message:
            "Thank you for your message. I'm here to help you with any questions or concerns.",
          timestamp: new Date(),
        };
        setVoiceChatMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const closeVoiceChat = () => {
    setShowVoiceChatModal(false);
    setVoiceChatMessages([]);
    setCurrentVoiceMessage("");
    setIsRecording(false);
    setMicLevel(0);
    setSelectedAgentForChat(null);

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop microphone stream
    if (microphoneRef.current && microphoneRef.current.mediaStream) {
      microphoneRef.current.mediaStream
        .getTracks()
        .forEach((track) => track.stop());
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset refs
    analyserRef.current = null;
    microphoneRef.current = null;
    dataArrayRef.current = null;
  };

  // Call Functions
  const handleCall = (agent) => {
    setSelectedAgentForCall(agent);
    setShowCallModal(true);
    setCallStage("input");
    setOpenMenuId(null);
  };

  const initiateCall = () => {
    if (phoneNumber.trim()) {
      setCallStage("connecting");

      // Simulate connection process
      setTimeout(() => {
        setCallStage("connected");
        setIsCallConnected(true);
        setCallMessages([
          {
            id: 1,
            type: "ai",
            message:
              selectedAgentForCall.firstMessage ||
              "Hello! This is your AI assistant. How can I help you today?",
            timestamp: new Date(),
          },
        ]);
        startCallTimer();
      }, 3000);
    }
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
  };

  const cancelCall = () => {
    setShowCallModal(false);
    setPhoneNumber("");
    setContactName("");
    setCallStage("input");
    setIsCallConnected(false);
    setCallDuration(0);
    setCallMessages([]);
    setCurrentCallMessage("");
    setIsCallRecording(false);
    setCallMicLevel(0);
    setSelectedAgentForCall(null);
    stopCallTimer();
    if (callMicIntervalRef.current) {
      clearInterval(callMicIntervalRef.current);
    }
  };

  const endCall = () => {
    setIsCallConnected(false);
    setIsCallRecording(false);
    setCallMicLevel(0);
    stopCallTimer();
    if (callMicIntervalRef.current) {
      clearInterval(callMicIntervalRef.current);
    }
    setTimeout(() => {
      cancelCall();
    }, 1000);
  };

  const startCallRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context for call
      const callAudioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const callAnalyser = callAudioContext.createAnalyser();
      const callMicrophone = callAudioContext.createMediaStreamSource(stream);

      // Connect microphone to analyzer
      callMicrophone.connect(callAnalyser);

      // Configure analyzer
      callAnalyser.fftSize = 256;
      const bufferLength = callAnalyser.frequencyBinCount;
      const callDataArray = new Uint8Array(bufferLength);

      setIsCallRecording(true);

      // Start analyzing microphone input for call
      const updateCallMicLevel = () => {
        if (!isCallRecording) return;

        callAnalyser.getByteFrequencyData(callDataArray);

        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < callDataArray.length; i++) {
          sum += callDataArray[i];
        }
        const average = sum / callDataArray.length;

        // Convert to percentage (0-100)
        const level = Math.min(100, (average / 255) * 100 * 3); // Multiply by 3 for better sensitivity
        setCallMicLevel(level);

        callMicIntervalRef.current = requestAnimationFrame(updateCallMicLevel);
      };

      updateCallMicLevel();

      // Store references for cleanup
      callMicIntervalRef.current = {
        audioContext: callAudioContext,
        stream: stream,
        animationFrame: callMicIntervalRef.current,
      };
    } catch (error) {
      console.error("Error accessing microphone for call:", error);
      alert("Unable to access microphone. Please check permissions.");
      setIsCallRecording(false);
    }
  };

  const stopCallRecording = () => {
    setIsCallRecording(false);
    setCallMicLevel(0);

    // Stop animation frame
    if (
      callMicIntervalRef.current &&
      callMicIntervalRef.current.animationFrame
    ) {
      cancelAnimationFrame(callMicIntervalRef.current.animationFrame);
    }

    // Stop microphone stream
    if (callMicIntervalRef.current && callMicIntervalRef.current.stream) {
      callMicIntervalRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }

    // Close audio context
    if (callMicIntervalRef.current && callMicIntervalRef.current.audioContext) {
      callMicIntervalRef.current.audioContext.close();
    }

    // Reset ref
    callMicIntervalRef.current = null;

    // Simulate processing and add message
    setTimeout(() => {
      const newMessage = {
        id: callMessages.length + 1,
        type: "human",
        message: "Voice message sent during call",
        timestamp: new Date(),
      };
      setCallMessages((prev) => [...prev, newMessage]);

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: callMessages.length + 2,
          type: "ai",
          message: "I heard your voice message. How can I assist you further?",
          timestamp: new Date(),
        };
        setCallMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }, 1000);
  };

  const sendCallMessage = () => {
    if (currentCallMessage.trim()) {
      const newMessage = {
        id: callMessages.length + 1,
        type: "human",
        message: currentCallMessage,
        timestamp: new Date(),
      };
      setCallMessages((prev) => [...prev, newMessage]);
      setCurrentCallMessage("");

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: callMessages.length + 2,
          type: "ai",
          message:
            "I understand. Let me help you with that. Is there anything specific you'd like to know?",
          timestamp: new Date(),
        };
        setCallMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voiceChatMessages, callMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup voice chat microphone
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (microphoneRef.current && microphoneRef.current.mediaStream) {
        microphoneRef.current.mediaStream
          .getTracks()
          .forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // Cleanup call timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }

      // Cleanup call microphone
      if (callMicIntervalRef.current) {
        if (callMicIntervalRef.current.animationFrame) {
          cancelAnimationFrame(callMicIntervalRef.current.animationFrame);
        }
        if (callMicIntervalRef.current.stream) {
          callMicIntervalRef.current.stream
            .getTracks()
            .forEach((track) => track.stop());
        }
        if (callMicIntervalRef.current.audioContext) {
          callMicIntervalRef.current.audioContext.close();
        }
      }
    };
  }, []);

  // Ensure agents is always an array
  const agentsArray = Array.isArray(agents) ? agents : [];

  return (
    <div className="w-full">
      {agentsArray.length === 0 ? (
        <div className="text-center py-16 px-8 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUser className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Agents Yet
            </h3>
            <p className="text-gray-500">
              Create your first AI agent to get started!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentsArray.map((agent, index) => {
            const currentAgentState = agentStates[agent._id] || { isActive: true, isToggling: false };
            const isActive = currentAgentState.isActive;
            const isToggling = currentAgentState.isToggling;
            
            return (
              <div
                key={agent._id}
                className={`group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden cursor-pointer relative ${
                  !isActive ? 'opacity-60' : ''
                }`}
                onClick={() => handleViewDetails(agent)}
              >
                {/* Active Status Indicator */}
                <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
                  isActive ? 'bg-green-500' : 'bg-red-500'
                } z-10`} 
                title={isActive ? 'Agent is Active' : 'Agent is Inactive'}
                />

                {/* Header */}
                <div
                  className={`bg-gradient-to-r ${getAgentColor(index)} px-6 py-4 ${
                    !isActive ? 'grayscale' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-semibold text-lg truncate capitalize">
                      {agent.agentName}
                    </h3>
                    <div className="flex items-center gap-1">
                      {/* Active/Inactive Toggle Button */}
                      <button
                        onClick={(e) => toggleActiveStatus(agent, e)}
                        disabled={isToggling}
                        className={`p-2 transition-colors rounded-lg ${
                          isToggling 
                            ? 'text-white/50 cursor-not-allowed' 
                            : isActive
                              ? 'text-green-300 hover:text-green-100 hover:bg-white/10'
                              : 'text-red-300 hover:text-red-100 hover:bg-white/10'
                        }`}
                        title={isToggling ? 'Updating...' : isActive ? 'Deactivate Agent' : 'Activate Agent'}
                      >
                        {isToggling ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : isActive ? (
                          <FiEye className="w-4 h-4" />
                        ) : (
                          <FiEyeOff className="w-4 h-4" />
                        )}
                      </button>

                      {/* QR Code Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowQR(agent);
                        }}
                        disabled={!isActive}
                        className={`p-2 rounded-lg transition-colors ${
                          isActive 
                            ? 'text-white/70 hover:text-white hover:bg-white/10'
                            : 'text-white/30 cursor-not-allowed'
                        }`}
                        title={isActive ? "Show QR Code" : "Agent must be active to show QR"}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      {/* Voice Chat Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isActive) handleVoiceChat(agent);
                        }}
                        disabled={!isActive}
                        className={`p-2 rounded-lg transition-colors ${
                          isActive 
                            ? 'text-white/70 hover:text-white hover:bg-white/10'
                            : 'text-white/30 cursor-not-allowed'
                        }`}
                        title={isActive ? "AI Talk" : "Agent must be active for AI Talk"}
                      >
                        <FiMic className="w-4 h-4" />
                      </button>

                      {/* Call Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isActive) handleCall(agent);
                        }}
                        disabled={!isActive}
                        className={`p-2 rounded-lg transition-colors ${
                          isActive 
                            ? 'text-white/70 hover:text-white hover:bg-white/10'
                            : 'text-white/30 cursor-not-allowed'
                        }`}
                        title={isActive ? "AI Dial" : "Agent must be active for AI Dial"}
                      >
                        <FiPhoneCall className="w-4 h-4" />
                      </button>

                      {/* More Options Button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(agent._id);
                          }}
                          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="More options"
                        >
                          <FiMoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === agent._id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(agent);
                              }}
                              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <FiEdit className="w-4 h-4" />
                              Edit Agent
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(agent._id);
                              }}
                              className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Delete Agent
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  {/* Active Status Banner */}
                  {!isActive && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FiAlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          Agent is currently inactive
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block font-semibold text-gray-700">
                      Description
                    </label>
                    <p className="text-gray-600 text-sm leading-relaxed italic truncate overflow-hidden whitespace-nowrap">
                      "{agent.description}"
                    </p>
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
                          {agent.category || "Not specified"}
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
                          {formatPersonality(agent.personality)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* First Message Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FiMessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          First Message
                        </span>
                        <p className="text-sm font-medium text-gray-800">
                          {agent.firstMessage || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(agent._id);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                      >
                        <FiVolume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {playingAgentId === agent._id && audioUrl && (
                      <div className="mt-4 space-y-3">
                        <audio
                          controls
                          autoPlay
                          src={audioUrl}
                          onEnded={stopAudio}
                          className="w-full"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            stopAudio();
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <FiSquare className="w-4 h-4" />
                          Stop
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* QR Code Modal with Download Button */}
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
                />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">
                  Scan to Talk with AI Agent - {selectedAgentForQR.agentName}
                </h4>
                <p className="text-gray-600 text-sm">
                  Scan this QR code with your mobile device to start a voice conversation with {selectedAgentForQR.agentName}
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
        clientId={clientId}
        onEdit={onEdit}
      />

      {/* Voice Chat Modal */}
      {showVoiceChatModal && selectedAgentForChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    AI Talk ({selectedAgentForChat.agentName})
                  </h3>
                  <p className="text-sm opacity-90">
                    Conversation with AI Agent
                  </p>
                </div>
                <button
                  onClick={closeVoiceChat}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-3">
                {voiceChatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === "human" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.type === "human"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Voice Recording Section */}
              <div className="flex items-center justify-center py-4">
                <div className="relative">
                  <button
                    onClick={
                      isRecording ? stopVoiceRecording : startVoiceRecording
                    }
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 scale-110"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    <FiMic className="w-6 h-6 text-white" />
                  </button>

                  {/* Mic Level Indicator */}
                  {isRecording && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <div
                        className="w-3 h-3 bg-white rounded-full"
                        style={{
                          transform: `scale(${0.5 + (micLevel / 100) * 0.5})`,
                          transition: "transform 0.1s ease",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {isRecording
                    ? "Recording... Click to stop"
                    : "Click the mic to start recording"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && selectedAgentForCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    {callStage === "input" && `AI Call by agent ${selectedAgentForCall.agentName}`}
                    {callStage === "connecting" && "Connecting..."}
                    {callStage === "connected" &&
                      `Call in Progress - ${formatTime(callDuration)}`}
                  </h3>
                </div>
                <button
                  onClick={cancelCall}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {callStage === "input" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="example: Jay sharma"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"  
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="example: 8873987243"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={cancelCall}
                      className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={initiateCall}
                      disabled={!phoneNumber.trim()}
                      className={`px-6 py-3 text-white rounded-lg transition-colors ${
                        phoneNumber.trim()
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Call
                    </button>
                  </div>
                </div>
              )}

              {callStage === "connecting" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <FiLoader className="w-8 h-8 text-green-600 animate-spin" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <FiWifi className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Connecting...
                    </h4>
                    <p className="text-gray-600">
                      Establishing connection to {phoneNumber}
                    </p>
                  </div>
                </div>
              )}

              {callStage === "connected" && (
                <div className="space-y-4">
                  {/* Call Status */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-700 font-medium">
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">
                        {formatTime(callDuration)}
                      </span>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-3">
                    {callMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.type === "human" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.type === "human"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Voice Recording Section */}
                  <div className="flex items-center justify-center py-4">
                    <div className="relative">
                      <button
                        onClick={
                          isCallRecording
                            ? stopCallRecording
                            : startCallRecording
                        }
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCallRecording
                            ? "bg-red-500 hover:bg-red-600 scale-110"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        <FiMic className="w-6 h-6 text-white" />
                      </button>

                      {/* Mic Level Indicator */}
                      {isCallRecording && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                          <div
                            className="w-3 h-3 bg-white rounded-full"
                            style={{
                              transform: `scale(${
                                0.5 + (callMicLevel / 100) * 0.5
                              })`,
                              transition: "transform 0.1s ease",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call Status */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {isCallRecording
                        ? "Recording... Click to stop"
                        : "Click the mic to start recording"}
                    </p>
                  </div>

                  {/* Call Controls */}
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={endCall}
                      className="px-8 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <FiPhoneCall className="w-4 h-4 rotate-90" />
                      End Call
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentList;