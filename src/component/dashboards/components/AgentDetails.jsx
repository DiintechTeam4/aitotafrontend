"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiVolume2,
  FiSquare,
  FiUser,
  FiMessageSquare,
  FiTag,
  FiCalendar,
  FiClock,
  FiSettings,
  FiPhone,
  FiGlobe,
  FiMic,
  FiPhoneCall,
  FiSend,
  FiWifi,
  FiWifiOff,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const AgentDetails = ({ agent, isOpen, onClose, clientId }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showVoiceChatModal, setShowVoiceChatModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [callStage, setCallStage] = useState("input"); // input, connecting, connected
  const [voiceChatMessages, setVoiceChatMessages] = useState([]);
  const [currentVoiceMessage, setCurrentVoiceMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [callMessages, setCallMessages] = useState([]);
  const [currentCallMessage, setCurrentCallMessage] = useState("");
  const [isCallRecording, setIsCallRecording] = useState(false);
  const [callMicLevel, setCallMicLevel] = useState(0);

  const micIntervalRef = useRef(null);
  const callTimerRef = useRef(null);
  const callMicIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Audio context and analyzer for real microphone input
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

  const formatPersonality = (personality) => {
    return personality.charAt(0).toUpperCase() + personality.slice(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const playAudio = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agent._id}/audio?clientId=${clientId}`,
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
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const stopAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const handleVoiceChat = () => {
    setShowVoiceChatModal(true);
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

  const handleCall = () => {
    setShowCallModal(true);
    setCallStage("input");
  };

  const makeAIDialCall = async (targetPhoneNumber, agentCallerId, agentApiKey, clientUuid) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        throw new Error("Client token not found. Please log in.");
      }

      const callPayload = {
        transaction_id: "CTI_BOT_DIAL",
        phone_num: targetPhoneNumber.replace(/[^\d]/g, ""), // Remove non-digits
        uniqueid: `aidial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
        callerid: agentCallerId,
        uuid: clientUuid,
        custom_param: {
          agentId: agent._id,
          agentName: agent.agentName,
          // Add any other custom parameters relevant to the call
        },
        resFormat: 3,
      };

      console.log("Sending AI Dial request with payload:", callPayload);
      console.log("Using API Key:", agentApiKey);

      const response = await fetch(`${API_BASE_URL}/client/proxy/clicktobot`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: agentApiKey, // Use the agent's specific API key
          payload: callPayload,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to initiate AI Dial call.");
      }

      console.log("AI Dial response:", result);
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error making AI Dial call:", error);
      return { success: false, error: error.message };
    }
  };

  const initiateCall = async () => {
    if (phoneNumber.trim()) {
      setCallStage("connecting");
      setCallMessages([]); // Clear previous messages

      const result = await makeAIDialCall(
        phoneNumber,
        agent.callerId,
        agent.X_API_KEY,
        clientId // Assuming clientId is passed as a prop
      );

      if (result.success) {
        setCallStage("connected");
        setIsCallConnected(true);
        // No call messages needed for this simplified view
        // startCallTimer(); // No need for timer if duration isn't displayed
      } else {
        setCallStage("input"); // Revert to input on failure
        setIsCallConnected(false);
        alert(`Failed to initiate call: ${result.error}`);
        console.error("AI Dial initiation failed:", result.error);
      }
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
    stopCallTimer();
    if (callMicIntervalRef.current) {
      clearInterval(callMicIntervalRef.current);
    }
  };

  const endCall = () => {
    // This function is no longer directly called by a button in the UI
    // but kept for potential internal logic or future use.
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

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 ml-64">
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-black px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-white font-bold text-2xl capitalize">
                {agent.agentName}
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                Agent ID: {agent._id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between gap-4">
            {/* Description Section */}
            <div className="bg-gray-50 rounded-lg p-4 w-1/2">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5" />
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed italic">
                "{agent.description}"
              </p>
            </div>

            {/* AI Interaction Section */}
            <div className="bg-gray-50 rounded-lg p-4 w-1/2">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiUser className="w-5 h-5" />
                AI Interaction
              </h3>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleVoiceChat}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FiMic className="w-4 h-4" />
                  AI Talk
                </button>

                <button
                  onClick={handleCall}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <FiPhoneCall className="w-4 h-4" />
                  AI Dial
                </button>
              </div>
            </div>
          </div>

          {/* Agent Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiUser className="w-5 h-5" />
                Basic Information
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
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

                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
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

                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <FiPhone className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Voice Selection
                    </span>
                    <p className="text-sm font-medium text-gray-800">
                      {agent.voiceSelection ? "Anushka" : "Abhilash"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <FiGlobe className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Language
                    </span>
                    <p className="text-sm font-medium text-gray-800">
                      {agent.language || "English"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Communication Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiSettings className="w-5 h-5" />
                Communication Settings
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <FiMessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-small text-gray-500 uppercase tracking-wide">
                      First Message
                    </span>
                    <p className="text-sm font-small text-gray-800">
                      {agent.firstMessage || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <FiMessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-small text-gray-500 uppercase tracking-wide">
                      Knowledge Base
                    </span>
                    <p className="text-sm font-small text-gray-800">
                      {agent.systemPrompt || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Preview Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiVolume2 className="w-5 h-5" />
              Voice Preview
            </h3>

            <div className="flex items-center gap-4">
              <button
                onClick={isPlaying ? stopAudio : playAudio}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                  isPlaying
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {isPlaying ? (
                  <>
                    <FiSquare className="w-4 h-4" />
                    Stop Audio
                  </>
                ) : (
                  <>
                    <FiVolume2 className="w-4 h-4" />
                    Play Audio
                  </>
                )}
              </button>

              {isPlaying && audioUrl && (
                <audio
                  controls
                  autoPlay
                  src={audioUrl}
                  onEnded={stopAudio}
                  className="flex-1"
                />
              )}
            </div>
          </div>

          {/* Additional Details */}
          {agent.additionalSettings && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Additional Settings
              </h3>
              <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(agent.additionalSettings, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    {callStage === "input" && "Enter Name and Phone Number"}
                    {callStage === "connecting" && "Connecting..."}
                    {callStage === "connected" && "Call Connected"}
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
                      placeholder="example: John Doe"
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
                      placeholder="(example +08873987243)"
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
                  <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                        <FiPhoneCall className="w-12 h-12 text-green-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <FiCheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h4 className="text-2xl font-bold text-green-700 mb-2">
                        Call Connected
                      </h4>
                      {/* Removed duration display */}
                    </div>
                  </div>
                  {/* Removed call messages display */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Chat Modal */}
      {showVoiceChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    AI Talk ({agent.agentName})
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

              {/* Text Input */}
              {/* <div className="flex gap-2">
                <input
                  type="text"
                  value={currentVoiceMessage}
                  onChange={(e) => setCurrentVoiceMessage(e.target.value)}
                  placeholder="Or type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === "Enter" && sendVoiceMessage()}
                />
                <button
                  onClick={sendVoiceMessage}
                  disabled={!currentVoiceMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div> */}

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
    </div>
  );
};

export default AgentDetails;
