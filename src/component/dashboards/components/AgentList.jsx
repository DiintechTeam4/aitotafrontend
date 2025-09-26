"use client";

import { useState, useEffect, useRef } from "react";
import CallLogs from "./CallLogs";
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
import { FaHistory } from "react-icons/fa";
import { QrCode } from "lucide-react";

import { API_BASE_URL } from "../../../config";
import AgentDetails from "./AgentDetails";
import QRCode from "qrcode";

// QR Code Logo Configuration
// To customize the logo, update these values:
const QR_LOGO_CONFIG = {
  logoUrl: "/AitotaLogo.png", // Path to your logo image (relative to public folder)
  logoSize: 0.25, // Logo size as a fraction of QR code size (0.1 = 10%, 0.2 = 20%, etc.)
  // Recommended logoSize: 0.15-0.25 for best scannability

  // Alternative logo options (uncomment and modify as needed):
  // logoUrl: '/your-custom-logo.png', // Your custom logo
  // logoUrl: '/company-logo.jpg', // Company logo
  // logoUrl: '/brand-icon.svg', // Brand icon

  // Logo size recommendations:
  // - 0.1 (10%): Very small, highly scannable
  // - 0.15 (15%): Small, good scannability
  // - 0.2 (20%): Medium, balanced
  // - 0.25 (25%): Large, may affect scannability
  // - 0.3+ (30%+): Very large, not recommended
};

// QR Code Component with Logo Support
//
// This component generates QR codes with optional logo overlays.
// The logo is placed in the center of the QR code with a white circular background
// to ensure the QR code remains scannable.
//
// Props:
// - value: The text/URL to encode in the QR code
// - size: The size of the QR code in pixels
// - bgColor: Background color of the QR code
// - fgColor: Foreground color of the QR code
// - logoUrl: URL to the logo image (optional)
// - logoSize: Size of the logo as a fraction of QR code size (0.1-0.25 recommended)
//
// Logo Requirements:
// - Should be a square image for best results
// - PNG or JPG format recommended
// - Place logo files in the public folder
// - Keep logo size under 25% of QR code size for best scannability
//
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
          // Generate QR code with logo overlay
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
          // Generate regular QR code
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
      // Create canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = size;
      canvas.height = size;

      // Generate QR code data URL
      QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      })
        .then((qrDataUrl) => {
          // Create image from QR code
          const qrImage = new Image();
          qrImage.onload = () => {
            // Draw QR code on canvas
            ctx.drawImage(qrImage, 0, 0, size, size);

            // Load and draw logo
            const logoImage = new Image();
            logoImage.onload = () => {
              // Calculate logo dimensions (logoSize is a fraction of QR code size)
              const logoWidth = size * logoSize;
              const logoHeight = size * logoSize;

              // Center the logo
              const logoX = (size - logoWidth) / 2;
              const logoY = (size - logoHeight) / 2;

              // Create a white background circle for the logo
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

              // Draw logo
              ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

              // Convert canvas to data URL
              const finalDataUrl = canvas.toDataURL("image/png");
              resolve(finalDataUrl);
            };

            logoImage.onerror = () => {
              // If logo fails to load, just return QR code without logo
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

const AgentList = ({ agents, isLoading, onEdit, onDelete, clientId }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [playingAgentId, setPlayingAgentId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);
  const [historyAgent, setHistoryAgent] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [agentStates, setAgentStates] = useState({});

  // QR Code Modal States
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedAgentForQR, setSelectedAgentForQR] = useState(null);

  // Voice Chat Modal States (Updated for WebSocket)
  const [showVoiceChatModal, setShowVoiceChatModal] = useState(false);
  const [selectedAgentForChat, setSelectedAgentForChat] = useState(null);

  // WebSocket related states
  const [wsConnection, setWsConnection] = useState(null);
  const [wsConnectionStatus, setWsConnectionStatus] = useState("disconnected");
  const [isAITalking, setIsAITalking] = useState(false);
  const [streamSid, setStreamSid] = useState(null);
  const [isAudioStreaming, setIsAudioStreaming] = useState(false);
  const [isStoppingAudio, setIsStoppingAudio] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  // Reconnection states
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [maxReconnectAttempts] = useState(5);
  const [reconnectDelay, setReconnectDelay] = useState(1000);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastDisconnectReason, setLastDisconnectReason] = useState("");

  // Speech detection states
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [userSpeechEnded, setUserSpeechEnded] = useState(false);
  const [aiStatus, setAiStatus] = useState("idle"); // 'idle', 'listening', 'thinking', 'speaking'

  // Debug states
  const [debugLogs, setDebugLogs] = useState([]);
  const [audioStats, setAudioStats] = useState({
    chunksRecorded: 0,
    chunksSent: 0,
    bytesProcessed: 0,
    lastChunkTime: null,
    streamingActive: false,
  });

  // Call Modal States
  const [showCallModal, setShowCallModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [callStage, setCallStage] = useState("input"); // input, connecting, connected, timeout, terminated
  const [callDuration, setCallDuration] = useState(0);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [callMessages, setCallMessages] = useState([]);
  const [currentCallMessage, setCurrentCallMessage] = useState("");
  const [isCallRecording, setIsCallRecording] = useState(false);
  const [callMicLevel, setCallMicLevel] = useState(0);
  const [selectedAgentForCall, setSelectedAgentForCall] = useState(null);
  const [dialUniqueId, setDialUniqueId] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveTranscriptLines, setLiveTranscriptLines] = useState([]);
  const [callTerminationReason, setCallTerminationReason] = useState("");
  const logsPollRef = useRef(null);
  const callTimeoutRef = useRef(null);

  // Recent calls for quick selection
  const [recentCalls, setRecentCalls] = useState([]);
  const [recentCallsLoading, setRecentCallsLoading] = useState(false);

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

  // Audio context and processing refs
  const audioPlaybackContextRef = useRef(null);
  const streamRef = useRef(null);
  const isStreamingActiveRef = useRef(false);
  const processorNodeRef = useRef(null);
  const wsConnectionRef = useRef(null);
  const streamSidRef = useRef(null);

  // Reconnection refs
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Audio playback buffer refs
  const audioBufferQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const audioSourceRef = useRef(null);
  const audioBufferRef = useRef(null);
  const playbackStartTimeRef = useRef(0);
  const nextPlayTimeRef = useRef(0);

  // Speech detection refs
  const silenceTimerRef = useRef(null);
  const silenceStartTimeRef = useRef(null);

  // Call termination state
  const [callTerminationData, setCallTerminationData] = useState({
    accountSid: null,
    callSid: null,
    streamSid: null,
  });
  const [isTerminatingCall, setIsTerminatingCall] = useState(false);

  // Add refs to avoid stale closures
  const callStageRef = useRef(callStage);
  const isCallConnectedRef = useRef(isCallConnected);
  const liveTranscriptRef = useRef(liveTranscript);
  const callInitiatedTimeRef = useRef(null);

  // Initialize agent states
  useEffect(() => {
    if (agents && agents.length > 0) {
      const initialStates = {};
      agents.forEach((agent) => {
        initialStates[agent._id] = {
          isActive: agent.isActive !== undefined ? agent.isActive : true,
          isToggling: false,
        };
      });
      setAgentStates(initialStates);
    }
  }, [agents]);

  // Update refs when state changes to avoid stale closures
  useEffect(() => {
    callStageRef.current = callStage;
  }, [callStage]);

  useEffect(() => {
    isCallConnectedRef.current = isCallConnected;
  }, [isCallConnected]);

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop continuous streaming
      stopContinuousAudioStreaming();

      // Stop continuous playback
      stopContinuousPlayback();

      // Clear speech detection timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Cleanup call timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }

      // Clear call timeout
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      // Disconnect WebSocket
      disconnectWebSocket();
    };
  }, []);

  // Debug logging function
  const addDebugLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    console.log(`[${type.toUpperCase()}] ${timestamp}: ${message}`);
    setDebugLogs((prev) => [...prev.slice(-19), logEntry]);
  };

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

  // Enhanced WebSocket connection management with reconnection
  const connectToWebSocket = (isReconnect = false, agentData = null) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      addDebugLog("WebSocket already connected", "info");
      return;
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (isReconnect) {
      setIsReconnecting(true);
      addDebugLog(
        `Reconnection attempt ${
          reconnectAttemptsRef.current + 1
        }/${maxReconnectAttempts}`,
        "info"
      );
    } else {
      setReconnectAttempts(0);
      reconnectAttemptsRef.current = 0;
    }

    setWsConnectionStatus("connecting");
    addDebugLog("Attempting WebSocket connection...", "info");

    // Use the correct WebSocket URL format that matches your server
    const wsUrl = `wss://test.aitota.com/ws`;
    addDebugLog(`Connecting to: ${wsUrl}`, "info");

    const ws = new WebSocket(wsUrl);

    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        addDebugLog("WebSocket connection timeout", "error");
        ws.close();
        handleConnectionFailure("Connection timeout");
      }
    }, 10000); // 10 second timeout

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      addDebugLog("WebSocket connected successfully", "success");
      setWsConnectionStatus("connected");
      setIsReconnecting(false);
      setReconnectAttempts(0);
      reconnectAttemptsRef.current = 0;
      setReconnectDelay(1000); // Reset delay
      setLastDisconnectReason("");

      // Generate a unique stream ID
      const streamId = `stream_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setStreamSid(streamId);

      // Use agentData if provided, otherwise fall back to selectedAgentForChat
      const agent = agentData || selectedAgentForChat;

      if (!agent) {
        addDebugLog(
          "No agent data available for WebSocket connection",
          "error"
        );
        ws.close();
        return;
      }

      // Send the start message in the format expected by your server
      const startMessage = {
        event: "start",
        streamSid: streamId,
        start: {
          accountSid: agent.accountSid || "default_account",
          streamSid: streamId,
          from: clientId,
          to: agent.callerId,
          extraData: btoa(
            JSON.stringify({
              agentId: agent._id,
              agentName: agent.agentName,
              clientId: clientId,
              CallDirection: "InDial", // This will be treated as inbound
            })
          ),
        },
      };

      addDebugLog(
        `Sending start message: ${JSON.stringify(startMessage)}`,
        "info"
      );
      ws.send(JSON.stringify(startMessage));

      // Set the WebSocket connection AFTER sending the start message
      setWsConnection(ws);
      wsConnectionRef.current = ws;
      streamSidRef.current = streamId;

      // Don't start audio streaming automatically - wait for user to click mic
      addDebugLog(
        "WebSocket connected. Click the microphone to start audio streaming.",
        "info"
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addDebugLog(`Received WebSocket message: ${data.event}`, "info");
        handleWebSocketMessage(data);
      } catch (error) {
        addDebugLog(
          `Error parsing WebSocket message: ${error.message}`,
          "error"
        );
      }
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      addDebugLog(`WebSocket error: ${error}`, "error");
      setWsConnectionStatus("disconnected");
      setIsReconnecting(false);
      setJustConnected(false);
    };

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      const reason = event.reason || `Code: ${event.code}`;
      addDebugLog(
        `WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`,
        "warning"
      );
      setWsConnectionStatus("disconnected");
      setWsConnection(null);
      setJustConnected(false);
      wsConnectionRef.current = null;
      setStreamSid(null);
      streamSidRef.current = null;
      setLastDisconnectReason(reason);
      stopContinuousAudioStreaming();

      // Attempt reconnection if not manually closed
      if (event.code !== 1000 && event.code !== 1001) {
        // Not normal closure
        handleConnectionFailure(reason);
      }
    };
  };

  // Handle connection failures and implement reconnection logic
  const handleConnectionFailure = (reason) => {
    setLastDisconnectReason(reason);
    setJustConnected(false);

    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      const delay = Math.min(
        reconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
        30000
      ); // Max 30 seconds

      addDebugLog(
        `Connection failed: ${reason}. Reconnecting in ${delay / 1000}s...`,
        "warning"
      );

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        setReconnectAttempts(reconnectAttemptsRef.current);
        connectToWebSocket(true);
      }, delay);
    } else {
      addDebugLog(
        `Max reconnection attempts (${maxReconnectAttempts}) reached. Please reconnect manually.`,
        "error"
      );
      setIsReconnecting(false);
    }
  };

  // Manual reconnect function
  const manualReconnect = () => {
    addDebugLog("Manual reconnection initiated", "info");

    // Reset reconnection state
    setReconnectAttempts(0);
    reconnectAttemptsRef.current = 0;
    setReconnectDelay(1000);
    setIsReconnecting(false);
    setJustConnected(false);

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Disconnect existing connection if any
    if (wsConnectionRef.current) {
      wsConnectionRef.current.close();
    }

    // Start new connection
    connectToWebSocket(false);
  };

  const handleWebSocketMessage = (data) => {
    switch (data.event) {
      case "connected":
        addDebugLog("WebSocket session connected", "success");
        break;

      case "start":
        addDebugLog(
          `Session started with streamSid: ${data.streamSid}`,
          "success"
        );
        setStreamSid(data.streamSid);
        break;

      case "media":
        if (data.media && data.media.payload) {
          addDebugLog(
            `Received audio chunk: ${data.media.payload.length} chars`,
            "info"
          );

          // Minimal receiving indicator - no state updates that could affect audio
          addDebugLog(
            `Received audio chunk: ${data.media.payload.length} chars`,
            "info"
          );

          playAudioChunk(data.media.payload);
        }
        break;

      case "stop":
        addDebugLog("Session stopped by server", "info");
        break;

      case "error":
        addDebugLog(
          `Server error: ${data.message || "Unknown error"}`,
          "error"
        );
        break;

      default:
        addDebugLog(`Unknown WebSocket event: ${data.event}`, "warning");
    }
  };

  const disconnectWebSocket = () => {
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsReconnecting(false);
    setReconnectAttempts(0);
    reconnectAttemptsRef.current = 0;
    setJustConnected(false);

    if (wsConnectionRef.current) {
      addDebugLog("Disconnecting WebSocket...", "info");
      wsConnectionRef.current.send(
        JSON.stringify({
          event: "stop",
          streamSid: streamSidRef.current,
        })
      );

      wsConnectionRef.current.close(1000, "Manual disconnect"); // Normal closure
      setWsConnection(null);
      wsConnectionRef.current = null;
      setWsConnectionStatus("disconnected");
      setStreamSid(null);
      streamSidRef.current = null;
    }
    stopContinuousAudioStreaming();
  };

  // Continuous audio streaming
  const startContinuousAudioStreaming = async () => {
    try {
      if (isStreamingActiveRef.current) {
        addDebugLog("Audio streaming already active", "warning");
        return;
      }

      // Check if WebSocket is ready before starting audio streaming
      if (
        !wsConnectionRef.current ||
        wsConnectionRef.current.readyState !== WebSocket.OPEN
      ) {
        addDebugLog(
          "WebSocket not ready, cannot start audio streaming",
          "error"
        );
        return;
      }

      if (!streamSidRef.current) {
        addDebugLog(
          "No streamSid available, cannot start audio streaming",
          "error"
        );
        return;
      }

      addDebugLog("Starting continuous audio streaming...", "info");

      // Request microphone permission with higher sample rate
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000, // Use browser's native sample rate
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      addDebugLog(
        "Microphone access granted for continuous streaming",
        "success"
      );

      // Create audio context with browser's default sample rate
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Resume audio context if suspended
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      addDebugLog(
        `Audio context created with sample rate: ${audioContextRef.current.sampleRate}`,
        "info"
      );

      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Create analyzer for visual feedback
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Use ScriptProcessorNode for reliable audio processing
      const bufferSize = 4096; // Larger buffer for more stable processing
      const scriptProcessor = audioContextRef.current.createScriptProcessor(
        bufferSize,
        1,
        1
      );

      let sampleBuffer = [];
      const targetSampleRate = 8000; // Target sample rate for server
      const downsampleRatio =
        audioContextRef.current.sampleRate / targetSampleRate;
      let downsampleCounter = 0;

      scriptProcessor.onaudioprocess = (event) => {
        if (!isStreamingActiveRef.current) {
          return;
        }

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);

        // Downsample from browser's native sample rate to 8kHz
        for (let i = 0; i < inputData.length; i++) {
          downsampleCounter++;
          if (downsampleCounter >= downsampleRatio) {
            sampleBuffer.push(inputData[i]);
            downsampleCounter = 0;

            // When we have 80 samples (10ms at 8kHz), process them
            if (sampleBuffer.length >= 80) {
              const chunk = new Float32Array(sampleBuffer.splice(0, 80));
              processAudioData(chunk);
            }
          }
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContextRef.current.destination);

      processorNodeRef.current = scriptProcessor;
      microphoneRef.current = { stream, scriptProcessor };

      isStreamingActiveRef.current = true;
      setIsAudioStreaming(true);

      // Reset audio stats
      setAudioStats({
        chunksRecorded: 0,
        chunksSent: 0,
        bytesProcessed: 0,
        lastChunkTime: null,
        streamingActive: true,
      });

      // Start visual feedback
      updateMicLevel();

      addDebugLog("Continuous audio streaming started successfully", "success");
    } catch (error) {
      addDebugLog(
        `Error starting continuous audio streaming: ${error.message}`,
        "error"
      );
      isStreamingActiveRef.current = false;
      setIsAudioStreaming(false);
    }
  };

  const stopContinuousAudioStreaming = () => {
    addDebugLog("Stopping continuous audio streaming...", "info");

    // Immediately set streaming state to false
    isStreamingActiveRef.current = false;
    setIsAudioStreaming(false);
    setIsStoppingAudio(false);
    setMicLevel(0);

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      addDebugLog("Animation frame cancelled", "info");
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        addDebugLog("Microphone track stopped", "info");
      });
      streamRef.current = null;
    }

    // Cleanup audio processor
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
      addDebugLog("ScriptProcessor disconnected", "info");
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
      addDebugLog("Audio context closed", "info");
    }

    // Reset refs
    analyserRef.current = null;
    microphoneRef.current = null;
    dataArrayRef.current = null;

    setAudioStats((prev) => ({
      ...prev,
      streamingActive: false,
    }));

    // Double-check that streaming state is false
    setTimeout(() => {
      if (isAudioStreaming) {
        addDebugLog(
          "Streaming state still true after stop - forcing to false",
          "warning"
        );
        setIsAudioStreaming(false);
      }
      if (isStoppingAudio) {
        addDebugLog(
          "Stopping state still true after stop - forcing to false",
          "warning"
        );
        setIsStoppingAudio(false);
      }
    }, 50);

    addDebugLog(
      `Continuous streaming stopped. Final stats: ${audioStats.chunksRecorded} chunks recorded, ${audioStats.chunksSent} chunks sent, ${audioStats.bytesProcessed} bytes processed`,
      "success"
    );
  };

  const processAudioData = (audioData) => {
    // Always process audio data, regardless of WebSocket state initially
    try {
      // Convert float32 to int16 (80 samples = 160 bytes)
      const int16Array = new Int16Array(80);
      for (let i = 0; i < 80; i++) {
        int16Array[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
      }

      // Convert to base64
      const bytes = new Uint8Array(int16Array.buffer);
      let binaryString = "";
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binaryString);

      // Get current WebSocket connection and streamSid from refs to avoid stale closures
      const currentWs = wsConnectionRef.current;
      const currentStreamSid = streamSidRef.current;

      // Update stats first (this will always happen)
      setAudioStats((prev) => ({
        chunksRecorded: prev.chunksRecorded + 1,
        chunksSent:
          currentWs && currentWs.readyState === WebSocket.OPEN
            ? prev.chunksSent + 1
            : prev.chunksSent,
        bytesProcessed: prev.bytesProcessed + 160,
        lastChunkTime: new Date().toLocaleTimeString(),
        streamingActive: true,
      }));

      // Send via WebSocket only if connection is ready
      if (
        currentWs &&
        currentWs.readyState === WebSocket.OPEN &&
        currentStreamSid
      ) {
        const mediaMessage = {
          event: "media",
          streamSid: currentStreamSid,
          media: {
            payload: base64Audio,
          },
        };

        currentWs.send(JSON.stringify(mediaMessage));

        // Minimal sending indicator - no state updates that could affect audio
        if (audioStats.chunksSent % 25 === 0) {
          addDebugLog(`Sent audio chunk #${audioStats.chunksSent + 1}`, "info");
        }

        // Log every 25th chunk to show activity
        setAudioStats((prev) => {
          if (prev.chunksSent % 25 === 0) {
            addDebugLog(
              `Sent audio chunk #${prev.chunksSent + 1} (160 bytes, ${
                base64Audio.length
              } chars base64)`,
              "info"
            );
          }
          return prev;
        });
      } else {
        // Log connection issues with more detail
        if (!currentWs) {
          addDebugLog(
            "No WebSocket connection - audio chunk generated but not sent",
            "warning"
          );
        } else if (currentWs.readyState !== WebSocket.OPEN) {
          const stateNames = {
            0: "CONNECTING",
            1: "OPEN",
            2: "CLOSING",
            3: "CLOSED",
          };
          addDebugLog(
            `WebSocket not ready (state: ${
              stateNames[currentWs.readyState] || currentWs.readyState
            }) - audio chunk generated but not sent`,
            "warning"
          );
        } else if (!currentStreamSid) {
          addDebugLog(
            "No streamSid - audio chunk generated but not sent",
            "warning"
          );
        }
      }
    } catch (error) {
      addDebugLog(`Error processing audio data: ${error.message}`, "error");
    }
  };

  const updateMicLevel = () => {
    if (!isStreamingActiveRef.current || !analyserRef.current) return;

    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(
        analyserRef.current.frequencyBinCount
      );
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Calculate average volume level
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;

    // Convert to percentage (0-100)
    const level = Math.min(100, (average / 255) * 100 * 3);
    setMicLevel(level);

    // Speech detection logic
    const isSilent = level < 10; // Threshold for silence detection

    if (!isSilent) {
      // User is speaking
      if (!isUserSpeaking) {
        setIsUserSpeaking(true);
        setUserSpeechEnded(false);
        setAiStatus("listening");
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      // User is silent – maybe between words or done
      if (isUserSpeaking && !silenceTimerRef.current) {
        silenceStartTimeRef.current = Date.now();

        silenceTimerRef.current = setTimeout(() => {
          const silenceDuration = Date.now() - silenceStartTimeRef.current;
          if (silenceDuration > 1200) {
            // > 1.2s = user probably done
            setUserSpeechEnded(true);
            setIsUserSpeaking(false);
            setAiStatus("idle");
          }
          silenceTimerRef.current = null;
        }, 1200);
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateMicLevel);
  };

  // Continuous audio playback for AI responses
  const playAudioChunk = async (base64Audio) => {
    try {
      addDebugLog(`Received audio chunk: ${base64Audio.length} chars`, "info");

      if (!audioPlaybackContextRef.current) {
        audioPlaybackContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)({
          sampleRate: 8000,
        });
        addDebugLog("Audio playback context created", "info");
      }

      const audioContext = audioPlaybackContextRef.current;

      // Ensure audio context is running
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Convert base64 to binary data
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert bytes to Int16Array (assuming 16-bit PCM)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);

      // Convert int16 to float32
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }

      // Add to buffer queue
      audioBufferQueueRef.current.push({
        data: float32Array,
        timestamp: Date.now(),
      });

      // Limit buffer size to prevent memory issues (keep last 100 chunks = ~4 seconds)
      if (audioBufferQueueRef.current.length > 100) {
        audioBufferQueueRef.current = audioBufferQueueRef.current.slice(-100);
        addDebugLog("Buffer queue trimmed to prevent memory overflow", "info");
      }

      // Start playback if not already playing
      if (!isPlayingRef.current) {
        // Show "thinking" status if user had finished speaking
        if (userSpeechEnded) {
          setAiStatus("thinking");

          // Short delay before showing "speaking"
          setTimeout(() => {
            setAiStatus("speaking");
          }, 100);
        } else {
          setAiStatus("speaking");
        }

        startContinuousPlayback();
      }
    } catch (error) {
      addDebugLog(`Error processing audio chunk: ${error.message}`, "error");
    }
  };

  // Start continuous audio playback
  const startContinuousPlayback = async () => {
    if (isPlayingRef.current) return;

    try {
      isPlayingRef.current = true;
      setIsAITalking(true);
      setAiStatus("speaking");

      const audioContext = audioPlaybackContextRef.current;
      if (!audioContext) return;

      // Ensure audio context is running
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Initialize playback timing with a small delay to ensure smooth start
      const startDelay = 0.1; // 100ms delay
      playbackStartTimeRef.current = audioContext.currentTime + startDelay;
      nextPlayTimeRef.current = audioContext.currentTime + startDelay;

      addDebugLog(
        `Starting continuous audio playback with ${startDelay}s delay`,
        "success"
      );

      // Start the playback loop
      setTimeout(() => {
        scheduleNextChunk();
      }, startDelay * 150);
    } catch (error) {
      addDebugLog(
        `Error starting continuous playback: ${error.message}`,
        "error"
      );
      isPlayingRef.current = false;
      setIsAITalking(false);
    }
  };

  // Schedule the next audio chunk for playback
  const scheduleNextChunk = () => {
    if (!isPlayingRef.current || !audioPlaybackContextRef.current) return;

    const audioContext = audioPlaybackContextRef.current;
    const queue = audioBufferQueueRef.current;

    if (queue.length === 0) {
      // No more chunks, stop playback
      isPlayingRef.current = false;
      setIsAITalking(false);
      setAiStatus("idle");
      setUserSpeechEnded(false);
      addDebugLog("Audio playback queue empty, stopping", "info");
      return;
    }

    // Process multiple chunks at once for better performance
    const chunksToProcess = Math.min(queue.length, 5); // Process up to 5 chunks at once
    let totalDuration = 0;

    for (let i = 0; i < chunksToProcess; i++) {
      const chunk = queue.shift();
      const float32Array = chunk.data;

      // Create audio buffer
      const buffer = audioContext.createBuffer(1, float32Array.length, 8000);
      buffer.getChannelData(0).set(float32Array);

      // Create and schedule audio source
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      // Schedule playback at the correct time
      const chunkDuration = float32Array.length / 8000; // Duration in seconds
      source.start(nextPlayTimeRef.current + totalDuration);

      totalDuration += chunkDuration;
    }

    // Update next play time
    nextPlayTimeRef.current += totalDuration;

    // Schedule next batch of chunks
    const timeUntilNext =
      (nextPlayTimeRef.current - audioContext.currentTime) * 1000;
    setTimeout(() => {
      scheduleNextChunk();
    }, Math.max(0, timeUntilNext - 20)); // 20ms buffer for batch processing

    // Log every 25th chunk (approximately every second)
    if (queue.length % 25 === 0) {
      addDebugLog(
        `Playing chunks, queue length: ${queue.length}, processed: ${chunksToProcess}`,
        "info"
      );
    }
  };

  // Stop continuous audio playback
  const stopContinuousPlayback = () => {
    isPlayingRef.current = false;
    setIsAITalking(false);
    audioBufferQueueRef.current = [];
    nextPlayTimeRef.current = 0;
    addDebugLog("Continuous audio playback stopped", "info");
  };

  const toggleActiveStatus = async (agent, e) => {
    e.stopPropagation();

    const currentState = agentStates[agent._id];
    if (currentState?.isToggling) return; // Prevent multiple requests

    try {
      // Set toggling state
      setAgentStates((prev) => ({
        ...prev,
        [agent._id]: {
          ...prev[agent._id],
          isToggling: true,
        },
      }));

      const newActiveStatus = !currentState?.isActive;

      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agent._id}/toggle-active?clientId=${clientId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
          body: JSON.stringify({
            isActive: newActiveStatus,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        // Update local state and, if activating, mark others with same accountSid as inactive for instant UI consistency
        setAgentStates((prev) => {
          const updated = { ...prev };
          updated[agent._id] = {
            ...(updated[agent._id] || {}),
            isActive: newActiveStatus,
            isToggling: false,
          };
          if (newActiveStatus && agent.accountSid) {
            agentsArray.forEach((a) => {
              if (a._id !== agent._id && a.accountSid === agent.accountSid) {
                updated[a._id] = {
                  ...(updated[a._id] || {
                    isToggling: false,
                    isActive: a.isActive !== undefined ? a.isActive : true,
                  }),
                  isActive: false,
                };
              }
            });
          }
          return updated;
        });

        // Show success message
        const statusText = newActiveStatus ? "activated" : "deactivated";
        console.log(`Agent ${agent.agentName} ${statusText} successfully`);
      } else {
        throw new Error(`Failed to toggle agent status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error toggling agent status:", error);

      // Reset toggling state on error
      setAgentStates((prev) => ({
        ...prev,
        [agent._id]: {
          ...prev[agent._id],
          isToggling: false,
        },
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

  // Download QR Code function with logo support
  const downloadQRCode = async () => {
    if (!selectedAgentForQR) return;

    try {
      const qrUrl = `${window.location.origin}/agent/${selectedAgentForQR._id}/talk`;

      // Use logo configuration
      const logoUrl = QR_LOGO_CONFIG.logoUrl;

      let qrDataUrl;
      if (logoUrl) {
        // Generate QR code with logo overlay
        qrDataUrl = await generateQRCodeWithLogo(
          qrUrl,
          512,
          "#fff",
          "#000",
          logoUrl,
          QR_LOGO_CONFIG.logoSize
        );
      } else {
        // Generate regular QR code
        qrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 512,
          margin: 2,
          color: {
            dark: "#000",
            light: "#fff",
          },
        });
      }

      // Create download link
      const link = document.createElement("a");
      link.download = `${selectedAgentForQR.agentName}-QR-Code.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      alert(
        `QR Code for ${selectedAgentForQR.agentName} downloaded successfully!`
      );
    } catch (error) {
      console.error("Error downloading QR code:", error);
      alert("Failed to download QR code. Please try again.");
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

        // Create and play audio automatically
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
      // Stop any currently playing audio
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

    // Clear debug logs
    setDebugLogs([]);
    addDebugLog("Voice chat modal opened", "info");

    // Reset connection states
    setJustConnected(false);

    // Don't connect to WebSocket automatically - wait for user to click mic
  };

  const closeVoiceChat = () => {
    addDebugLog("Closing voice chat...", "info");
    setShowVoiceChatModal(false);
    setMicLevel(0);
    setIsAITalking(false);

    // Reset speech detection states
    setIsUserSpeaking(false);
    setUserSpeechEnded(false);
    setAiStatus("idle");

    // Clear speech detection timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop continuous streaming
    stopContinuousAudioStreaming();

    // Stop continuous playback
    stopContinuousPlayback();

    // Disconnect WebSocket
    disconnectWebSocket();

    // Close audio playback context
    if (
      audioPlaybackContextRef.current &&
      audioPlaybackContextRef.current.state !== "closed"
    ) {
      audioPlaybackContextRef.current.close();
      audioPlaybackContextRef.current = null;
    }

    // Clear debug logs
    setDebugLogs([]);
    setSelectedAgentForChat(null);
  };

  // Call Functions
  const handleCall = (agent) => {
    setSelectedAgentForCall(agent);
    setShowCallModal(true);
    setCallStage("input");
    setOpenMenuId(null);

    // Fetch call termination data when opening the modal
    setTimeout(() => {
      fetchCallTerminationData();
    }, 100);

    // Fetch last 3 recent calls for quick fill
    setTimeout(() => {
      fetchRecentCalls();
    }, 0);
  };

  const makeAIDialCall = async (
    targetPhoneNumber,
    agentCallerId,
    agentApiKey,
    clientUuid,
    providedUniqueId
  ) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        throw new Error("Client token not found. Please log in.");
      }

      const uniqueId =
        providedUniqueId ||
        `aidial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const callPayload = {
        transaction_id: "CTI_BOT_DIAL",
        phone_num: targetPhoneNumber.replace(/[^\d]/g, ""),
        uniqueid: uniqueId,
        callerid: agentCallerId,
        uuid: clientUuid,
        custom_param: {
          agentId: selectedAgentForCall?._id,
          agentName: selectedAgentForCall?.agentName,
          contactName: contactName || "",
          uniqueid: uniqueId,
        },
        resFormat: 3,
      };

      const response = await fetch(`${API_BASE_URL}/client/proxy/clicktobot`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: agentApiKey,
          payload: callPayload,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to initiate AI Dial call.");
      }
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error making AI Dial call:", error);
      return { success: false, error: error.message };
    }
  };

  // New: Unified outbound dial - always delegate to backend to fetch agent telephony from DB
  const makeUnifiedOutboundCall = async (
    targetPhoneNumber,
    agent,
    clientUuid,
    providedUniqueId
  ) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) throw new Error("Client token not found. Please log in.");

      const phoneDigits = String(targetPhoneNumber || "").replace(/[^\d]/g, "");
      const uniqueId =
        providedUniqueId ||
        `aidial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Always call backend; backend will read all agent telephony fields (provider, callerId, X_API_KEY, etc.) from DB
      const resp = await fetch(`${API_BASE_URL}/client/calls/single`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: { phone: phoneDigits, name: contactName || "" },
          agentId: agent?._id,
          uniqueid: uniqueId,
          custom_field: { name: contactName || "" },
        }),
      });

      const data = await resp.json();
      if (!resp.ok || data?.success !== true) {
        throw new Error(data?.error || "Failed to initiate call");
      }
      return { success: true, data };
    } catch (error) {
      console.error("Unified outbound call error:", error);
      return { success: false, error: error.message };
    }
  };

  // Fetch recent 3 calls for this client
  const fetchRecentCalls = async () => {
    try {
      if (!clientId) return;
      setRecentCallsLoading(true);
      const params = new URLSearchParams({
        clientId: String(clientId),
        limit: "15",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      // Prefer agent-specific logs by filtering on customParams.agentId
      if (selectedAgentForCall?._id) {
        params.set("customField", "agentId");
        params.set("customValue", String(selectedAgentForCall._id));
      }
      const response = await fetch(`${API_BASE_URL}/logs?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch recent calls");
      const data = await response.json();
      const logs = Array.isArray(data?.logs) ? data.logs : [];
      // Map to {phoneNumber, contactName} and dedupe by phoneNumber
      const mapped = logs
        .map((l) => ({
          phoneNumber:
            l.mobile ||
            l?.metadata?.customParams?.phoneNumber ||
            l?.metadata?.customParams?.phone_num ||
            "",
          contactName:
            l?.metadata?.customParams?.contactName ||
            l?.metadata?.customParams?.contact_name ||
            "",
          createdAt: l.createdAt,
        }))
        .filter((x) => x.phoneNumber);

      const seen = new Set();
      const unique = [];
      for (const item of mapped) {
        const key = String(item.phoneNumber).replace(/[^\d]/g, "");
        if (!seen.has(key)) {
          seen.add(key);
          unique.push({
            phoneNumber: key,
            contactName: item.contactName,
            createdAt: item.createdAt,
          });
        }
        if (unique.length >= 3) break;
      }
      setRecentCalls(unique);
    } catch (e) {
      console.error("Failed to fetch recent calls:", e);
      setRecentCalls([]);
    } finally {
      setRecentCallsLoading(false);
    }
  };

  const initiateCall = async () => {
    if (!phoneNumber.trim() || !selectedAgentForCall) return;
    setCallStage("connecting");
    setCallMessages([]);

    // Clear any previous termination data when starting a new call
    setCallTerminationData({
      accountSid: null,
      callSid: null,
      streamSid: null,
    });

    const generatedUniqueId = `aidial-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setDialUniqueId(generatedUniqueId);

    const result = await makeUnifiedOutboundCall(
      phoneNumber,
      selectedAgentForCall,
      clientId,
      generatedUniqueId
    );

    if (result.success) {
      setCallStage("connecting"); // Start with "connecting" instead of "connected"
      setIsCallConnected(true);
      callInitiatedTimeRef.current = Date.now(); // Track when call was initiated
      // Don't start timer yet - wait for first transcript (WhatsApp-like behavior)
      startLogsPolling(generatedUniqueId);

      // Fetch call termination data when call is connected
      setTimeout(() => {
        fetchCallTerminationData();
      }, 1000);

      // Set 40-second timeout to check for progress
      callTimeoutRef.current = setTimeout(() => {
        // Check if we have any transcript or call activity
        if (
          !liveTranscriptRef.current ||
          liveTranscriptRef.current.trim() === ""
        ) {
          console.log(
            "40-second timeout reached - no transcript progress detected"
          );
          setCallStage("timeout");
          setIsCallConnected(false);
          stopCallTimer();
          stopLogsPolling();
        }
      }, 40000); // 40 seconds

      // Additional aggressive timeout for mobile disconnection detection
      setTimeout(() => {
        if (callStageRef.current === "connected" && logsPollRef.current) {
          console.log("Setting up aggressive mobile disconnection check...");

          // Check every 30 seconds if call is still active
          const mobileDisconnectCheck = setInterval(() => {
            if (callStageRef.current === "connected") {
              console.log(
                "Aggressive check: Verifying mobile call is still active..."
              );

              // Check if we're still in grace period
              const timeSinceInitiation = callInitiatedTimeRef.current
                ? Date.now() - callInitiatedTimeRef.current
                : 0;
              const isInGracePeriod = timeSinceInitiation < 15000; // 15-second grace period

              if (isInGracePeriod) {
                console.log("Still in grace period, skipping aggressive check");
                return;
              }

              // Force a poll and check if we're getting any response
              const forceCheck = async () => {
                try {
                  const params = new URLSearchParams({
                    uniqueid: generatedUniqueId,
                    clientId: String(clientId || ""),
                    limit: "1",
                    sortBy: "createdAt",
                    sortOrder: "desc",
                  });
                  const resp = await fetch(
                    `${API_BASE_URL}/logs?${params.toString()}`
                  );
                  if (resp.ok) {
                    const data = await resp.json();
                    const log = data?.logs?.[0];

                    if (log) {
                      const timeSinceLastUpdate =
                        Date.now() -
                        new Date(
                          log.metadata?.lastUpdated || log.createdAt
                        ).getTime();
                      console.log(
                        `Time since last update: ${timeSinceLastUpdate}ms`
                      );

                      // If no activity for more than 2 minutes, consider call disconnected
                      if (timeSinceLastUpdate > 120000) {
                        // 2 minutes
                        console.log(
                          "No recent activity detected, considering call disconnected from mobile"
                        );
                        clearInterval(mobileDisconnectCheck);
                        handleAutomaticCallTermination({
                          ...log,
                          leadStatus: "not_connected",
                          metadata: { ...log.metadata, isActive: false },
                        });
                      }
                    } else {
                      console.log(
                        "No log found, considering call disconnected"
                      );
                      clearInterval(mobileDisconnectCheck);
                      handleAutomaticCallTermination({
                        leadStatus: "not_connected",
                        metadata: { isActive: false },
                      });
                    }
                  }
                } catch (e) {
                  console.error("Aggressive check failed:", e);
                }
              };

              forceCheck();
            } else {
              clearInterval(mobileDisconnectCheck);
            }
          }, 30000); // Check every 30 seconds
        }
      }, 60000); // Start after 1 minute
    } else {
      setCallStage("input");
      setIsCallConnected(false);
      alert(`Failed to initiate call: ${result.error}`);
    }
  };

  const stopLogsPolling = () => {
    if (logsPollRef.current) {
      clearInterval(logsPollRef.current);
      logsPollRef.current = null;
    }
  };

  const startLogsPolling = (uniqueIdToTrack) => {
    stopLogsPolling();
    const poll = async () => {
      try {
        // Stop polling if call is already terminated
        if (callStageRef.current === "terminated") {
          console.log("Call already terminated, stopping polling");
          stopLogsPolling();
          return;
        }

        const params = new URLSearchParams({
          uniqueid: uniqueIdToTrack,
          clientId: String(clientId || ""),
          limit: "1",
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        const resp = await fetch(`${API_BASE_URL}/logs?${params.toString()}`);
        if (!resp.ok) return;
        const data = await resp.json();
        const log = data?.logs?.[0];

        if (log) {
          // Calculate time since call was initiated (do this first)
          const timeSinceInitiation = callInitiatedTimeRef.current
            ? Date.now() - callInitiatedTimeRef.current
            : 0;
          const isInGracePeriod = timeSinceInitiation < 15000; // 15-second grace period

          // Check call status from metadata FIRST - this is the most important check
          const active = log?.metadata?.isActive;
          const leadStatus = log?.leadStatus;

          console.log("Polling call status:", {
            uniqueId: uniqueIdToTrack,
            isActive: active,
            leadStatus: leadStatus,
            callStage: callStageRef.current,
            timeSinceInitiation: timeSinceInitiation,
            isInGracePeriod: isInGracePeriod,
          });

          // If we're in "connecting" stage and have transcript activity, transition to "connected"
          if (
            callStageRef.current === "connecting" &&
            log.transcript &&
            log.transcript.trim() !== ""
          ) {
            console.log(
              "Call transitioning from connecting to connected due to transcript activity"
            );
            setCallStage("connected");
          }

          // If we're in "connecting" stage and have any log activity (even without transcript), transition to "connected"
          if (callStageRef.current === "connecting" && log && log.createdAt) {
            const logAge = Date.now() - new Date(log.createdAt).getTime();
            if (logAge < 30000) {
              // Log is recent (within 30 seconds)
              console.log(
                "Call transitioning from connecting to connected due to recent log activity"
              );
              setCallStage("connected");
            }
          }

          // Fallback: If we're in "connecting" stage for more than 10 seconds, transition to "connected"
          if (
            callStageRef.current === "connecting" &&
            timeSinceInitiation > 10000
          ) {
            console.log(
              "Call transitioning from connecting to connected due to time elapsed"
            );
            setCallStage("connected");
          }

          // Special handling for call being answered (user lifting the phone)
          // Some backends might set specific status during this transition
          if (callStageRef.current === "connecting" && leadStatus === "maybe") {
            console.log(
              "Call detected as being answered (leadStatus: maybe), keeping in connecting state"
            );
            // Don't terminate, just wait for more activity
          }

          // Additional check for call being answered - look for specific metadata patterns
          if (callStageRef.current === "connecting" && log.metadata) {
            const metadata = log.metadata;
            // Check for various indicators that the call is being answered
            if (
              metadata.isActive === false &&
              (leadStatus === "maybe" || !leadStatus)
            ) {
              console.log(
                "Call detected as being answered (isActive: false, leadStatus: maybe), keeping in connecting state"
              );
              // Don't terminate, this is likely the transition period when user is lifting the phone
            }
          }

          // Check if call is inactive - ONLY check isActive status for termination (after grace period)
          if (active === false && !isInGracePeriod) {
            console.log(
              "Call detected as inactive (isActive: false), automatically terminating..."
            );
            handleAutomaticCallTermination(log);
            return; // Stop processing if call is terminated
          }

          // Check if transcript exists and process it
          if (typeof log.transcript === "string") {
            if (log.transcript !== liveTranscript) {
              setLiveTranscript(log.transcript);

              // Process transcript lines with timestamps
              const lines = log.transcript.split("\n").filter(Boolean);

              // Add timestamps to lines if they don't have them
              const linesWithTimestamps = lines.map((line) => {
                // If line already has a timestamp, keep it
                if (line.match(/^\[[^\]]+\]/)) {
                  return line;
                }

                // If no timestamp, add current time
                const now = new Date();
                const timestamp = now.toISOString();
                return `[${timestamp}] ${line}`;
              });

              setLiveTranscriptLines(linesWithTimestamps);

              // Start timer when first transcript is received (WhatsApp-like behavior)
              if (
                log.transcript.trim() !== "" &&
                callDuration === 0 &&
                !callTimerRef.current
              ) {
                console.log("First transcript received, starting call timer");
                startCallTimer();
              }

              // Clear timeout if we detect transcript activity
              if (callTimeoutRef.current && log.transcript.trim() !== "") {
                clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;
              }
            }
          }

          // Additional check: if no log found or log is very old, consider call disconnected (only after grace period)
          if (
            !log ||
            (log.createdAt &&
              Date.now() - new Date(log.createdAt).getTime() > 300000)
          ) {
            // 5 minutes
            console.log(
              "No recent log activity, considering call disconnected"
            );
            if (callStageRef.current === "connected" && !isInGracePeriod) {
              handleAutomaticCallTermination({
                ...log,
                leadStatus: "not_connected",
                metadata: { ...log?.metadata, isActive: false },
              });
            }
          }
        }
      } catch (e) {
        console.error("Error in call polling:", e);
        // If polling fails multiple times, consider call disconnected (only after grace period)
        const timeSinceInitiation = callInitiatedTimeRef.current
          ? Date.now() - callInitiatedTimeRef.current
          : 0;
        const isInGracePeriod = timeSinceInitiation < 15000; // 15-second grace period

        if (callStageRef.current === "connected" && !isInGracePeriod) {
          console.log("Polling failed, considering call disconnected");
          handleAutomaticCallTermination({
            leadStatus: "not_connected",
            metadata: { isActive: false },
          });
        }
      }
    };

    // Initial poll
    poll();

    // Set up regular polling with shorter interval for better responsiveness
    logsPollRef.current = setInterval(poll, 1500); // Poll every 1.5 seconds instead of 2

    // Also set up a backup check for long-running calls
    setTimeout(() => {
      if (callStageRef.current === "connected" && logsPollRef.current) {
        console.log("Setting up backup call status check...");
        // Additional check every 10 seconds for long calls
        const backupCheck = setInterval(() => {
          if (callStageRef.current === "connected") {
            console.log("Backup check: verifying call is still active...");
            poll(); // Force a poll check
          } else if (callStageRef.current === "terminated") {
            console.log("Call terminated, stopping backup check");
            clearInterval(backupCheck);
          } else {
            clearInterval(backupCheck);
          }
        }, 10000);
      }
    }, 10000);
  };

  const startCallTimer = () => {
    // Only start timer if we have transcript activity
    if (liveTranscriptRef.current && liveTranscriptRef.current.trim() !== "") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
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
    setDialUniqueId("");
    setLiveTranscript("");
    setLiveTranscriptLines([]);
    setCallTerminationReason("");
    callInitiatedTimeRef.current = null; // Reset initiated time
    stopLogsPolling();
    stopCallTimer();

    // Clear timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (callMicIntervalRef.current) {
      clearInterval(callMicIntervalRef.current);
    }
  };

  const endCall = () => {
    // Immediately stop all polling and timers to prevent automatic termination
    setIsCallConnected(false);
    setIsCallRecording(false);
    setCallMicLevel(0);
    stopLogsPolling();
    stopCallTimer();
    if (callMicIntervalRef.current) {
      clearInterval(callMicIntervalRef.current);
    }

    // Set call to terminated state immediately
    setCallStage("terminated");
    setCallTerminationReason("Call ended manually");

    // Don't show alert for manual termination - just let user see the compact header
    // The compact "Call Ended" header will be displayed instead
  };

  // Fetch call termination data from the latest call log
  const fetchCallTerminationData = async () => {
    try {
      if (!clientId) {
        console.error("Missing clientId for call termination");
        return { success: false, data: null };
      }

      // First try to get the most recent active call log
      const params = new URLSearchParams({
        clientId: String(clientId || ""),
        limit: "10", // Get more logs to find one with streamSid and callSid
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      console.log("Fetching call logs with params:", params.toString());

      const response = await fetch(`${API_BASE_URL}/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch call logs for termination");
      }

      const data = await response.json();
      console.log("Raw logs API response:", data);

      const logs = data?.logs || [];
      console.log("Processed logs array:", logs);

      // Find the first log that has both streamSid and callSid
      const log = logs.find((log) => log.streamSid && log.callSid);

      if (log) {
        // Extract accountSid from callSid (assuming format: accountSid_callId)
        const callSidParts = log.callSid.split("_");
        const accountSid = callSidParts[0] || "5104"; // Default fallback

        const terminationData = {
          accountSid,
          callSid: log.callSid,
          streamSid: log.streamSid,
        };

        console.log("Found call log for termination:", {
          streamSid: log.streamSid,
          callSid: log.callSid,
          accountSid,
          logId: log._id,
          createdAt: log.createdAt,
        });

        // Update state for UI display
        setCallTerminationData(terminationData);

        // Return the data directly
        return { success: true, data: terminationData };
      } else {
        console.error(
          "No call log found with streamSid and callSid. Available logs:",
          logs.map((l) => ({
            id: l._id,
            streamSid: l.streamSid,
            callSid: l.callSid,
            createdAt: l.createdAt,
            metadata: l.metadata,
            clientId: l.clientId,
          }))
        );
        return { success: false, data: null };
      }
    } catch (error) {
      console.error("Error fetching call termination data:", error);
      return { success: false, data: null };
    }
  };

  // Handle automatic call termination when call becomes inactive
  const handleAutomaticCallTermination = (log) => {
    console.log("Handling automatic call termination:", log);

    // Prevent multiple terminations
    if (callStageRef.current === "terminated") {
      console.log("Call already terminated, skipping...");
      return;
    }

    // Stop polling and timer
    stopLogsPolling();
    stopCallTimer();

    // Determine termination reason - PRIORITIZE isActive: false over leadStatus
    let reason = "Call ended";
    let detailedReason = "";

    // Check isActive status FIRST - this is the primary termination trigger
    if (log.metadata?.isActive === false) {
      reason = "Call disconnected";
      detailedReason = "The call was automatically detected as inactive";
    } else if (log.leadStatus) {
      // Only check leadStatus if isActive is not false
      switch (log.leadStatus) {
        case "not_connected":
          reason = "Call disconnected";
          detailedReason =
            "The call was disconnected from the mobile device or network";
          break;
        case "junk_lead":
          reason = "Call marked as junk lead";
          detailedReason = "The call was classified as not valuable";
          break;
        case "wrong_number":
          reason = "Wrong number";
          detailedReason = "The dialed number was incorrect or unreachable";
          break;
        case "decline":
          reason = "Call declined";
          detailedReason = "The recipient declined the call";
          break;
        case "maybe":
          // Don't terminate for 'maybe' status - this indicates user is answering
          console.log(
            "Call has leadStatus: maybe - keeping call active (user is answering)"
          );
          return; // Exit without terminating
        default:
          reason = `Call ended (${log.leadStatus})`;
          detailedReason = `Call terminated with status: ${log.leadStatus}`;
      }
    } else {
      reason = "Call disconnected";
      detailedReason = "The call connection was lost or terminated";
    }

    console.log(`Call termination details: ${reason} - ${detailedReason}`);

    // Set termination reason
    setCallTerminationReason(reason);

    // Update call stage to terminated
    setCallStage("terminated");
    setIsCallConnected(false);

    // Show alert when call is automatically terminated
    alert(
      `Call Terminated: ${reason}\n\n${detailedReason}\n\nCall history will remain visible until you close the modal.`
    );

    // Don't auto-close modal - let user manually close to view history
  };

  // Terminate the active call
  const terminateCall = async () => {
    try {
      setIsTerminatingCall(true);

      // First fetch the latest call termination data
      const result = await fetchCallTerminationData();
      if (!result.success || !result.data) {
        alert("Unable to get call termination data. Please try again.");
        setIsTerminatingCall(false);
        return;
      }

      // Use the fresh data returned from the API call
      const terminationData = result.data;

      // Prepare termination payload using the fresh data
      const terminationPayload = {
        event: "stop",
        sequenceNumber: 1,
        stop: {
          accountSid: terminationData.accountSid,
          callSid: terminationData.callSid,
        },
        streamSid: terminationData.streamSid,
      };

      console.log("Terminating call with payload:", terminationPayload);
      console.log("Fresh termination data used:", terminationData);
      console.log("Current callTerminationData state:", callTerminationData);

      // Send termination request
      const response = await fetch(
        "https://test.aitota.com/api/calls/terminate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(terminationPayload),
        }
      );

      const terminationResult = await response.json();

      if (terminationResult.success) {
        console.log("Call terminated successfully:", terminationResult);

        // Set termination state immediately for user-initiated termination
        setCallStage("terminated");
        setCallTerminationReason("Call terminated by user");
        setIsCallConnected(false);

        // Stop all call-related processes
        stopLogsPolling();
        stopCallTimer();

        // Don't show alert - the compact "Call Ended" header will be displayed
      } else {
        console.error("Call termination failed:", terminationResult);
        alert(
          `Call termination failed: ${
            terminationResult.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error terminating call:", error);
      alert(`Error terminating call: ${error.message}`);

      // Even if API call fails, mark call as terminated locally
      setCallStage("terminated");
      setCallTerminationReason(
        "Call termination failed - marked as terminated"
      );
      setIsCallConnected(false);
      stopLogsPolling();
      stopCallTimer();

      // Don't show alert - the compact "Call Ended" header will be displayed
    } finally {
      setIsTerminatingCall(false);
    }
  };

  // Format call duration to MM:SS format
  const formatCallDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Format message timestamp for display
  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      // If message is from today, show time only
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }

      // If message is from yesterday, show "Yesterday" and time
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}`;
      }

      // If message is older, show date and time
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      // If timestamp parsing fails, return current time
      return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
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
  }, [callMessages]);

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

  // Determine loading state and ensure agents is always an array when loaded
  const isAgentsLoading = Boolean(isLoading);
  const agentsArray = Array.isArray(agents) ? agents : [];
  // Active first sorting using current UI state when available
  const sortedAgents = agentsArray.slice().sort((a, b) => {
    const aActive =
      agentStates[a._id]?.isActive ??
      (a.isActive !== undefined ? a.isActive : true);
    const bActive =
      agentStates[b._id]?.isActive ??
      (b.isActive !== undefined ? b.isActive : true);
    if (aActive === bActive) return 0;
    return aActive ? -1 : 1;
  });

  return (
    <div className="w-full">
      {isAgentsLoading ? (
        <div className="text-center py-20 px-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
            <FiLoader className="w-8 h-8 text-green-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            Fetching agents…
          </h3>
          <p className="text-gray-500 text-sm">This may take a few seconds.</p>
        </div>
      ) : agentsArray.length === 0 ? (
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
          {sortedAgents.map((agent, index) => {
            const currentAgentState = agentStates[agent._id] || {
              isActive: true,
              isToggling: false,
            };
            const isActive = currentAgentState.isActive;
            const isToggling = currentAgentState.isToggling;

            return (
              <div
                key={agent._id}
                className={`group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden cursor-pointer relative ${
                  !isActive ? "opacity-60" : ""
                }`}
                onClick={() => handleViewDetails(agent)}
              >
                {/* Active Status Indicator */}
                <div
                  className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
                    isActive ? "bg-green-500" : "bg-red-500"
                  } z-10`}
                  title={isActive ? "Agent is Active" : "Agent is Inactive"}
                />

                {/* Header */}
                <div
                  className={`bg-gradient-to-r ${getAgentColor(
                    index
                  )} px-6 py-4 ${!isActive ? "grayscale" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-semibold text-lg truncate capitalize">
                      {agent.agentName}
                    </h3>
                    <div className="flex items-center">
                      {/* Active/Inactive Toggle Button */}
                      <button
                        onClick={(e) => toggleActiveStatus(agent, e)}
                        disabled={isToggling}
                        className={`p-2 transition-colors rounded-lg ${
                          isToggling
                            ? "text-white/50 cursor-not-allowed"
                            : isActive
                            ? "text-green-300 hover:text-green-100 hover:bg-white/10"
                            : "text-red-300 hover:text-red-100 hover:bg-white/10"
                        }`}
                        title={
                          isToggling
                            ? "Updating..."
                            : isActive
                            ? "Deactivate Agent"
                            : "Activate Agent"
                        }
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
                            ? "text-white/70 hover:text-white hover:bg-white/10"
                            : "text-white/30 cursor-not-allowed"
                        }`}
                        title={
                          isActive
                            ? "Show QR Code"
                            : "Agent must be active to show QR"
                        }
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
                            ? "text-white/70 hover:text-white hover:bg-white/10"
                            : "text-white/30 cursor-not-allowed"
                        }`}
                        title={
                          isActive
                            ? "AI Talk"
                            : "Agent must be active for AI Talk"
                        }
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
                            ? "text-white/70 hover:text-white hover:bg-white/10"
                            : "text-white/30 cursor-not-allowed"
                        }`}
                        title={
                          isActive
                            ? "AI Dial"
                            : "Agent must be active for AI Dial"
                        }
                      >
                        <FiPhoneCall className="w-4 h-4" />
                      </button>

                      {/* Call History Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryAgent(agent);
                          setShowCallHistoryModal(true);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isActive
                            ? "text-white/70 hover:text-white hover:bg-white/10"
                            : "text-white/30 cursor-not-allowed"
                        }`}
                        title={
                          isActive
                            ? "Call History"
                            : "Agent must be active for Call History"
                        }
                      >
                        <FaHistory className="w-4 h-4" />
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
                              if (playingAgentId === agent._id && audioUrl) {
                                stopAudio();
                              } else {
                                playAudio(agent._id);
                              }
                            }}
                            className="inline-flex items-center justify-center p-1 transition-colors duration-200 hover:scale-110 flex-shrink-0"
                            title={
                              playingAgentId === agent._id && audioUrl
                                ? "Stop Audio"
                                : "Play Audio"
                            }
                          >
                            {playingAgentId === agent._id && audioUrl ? (
                              <FiVolumeX
                                className={`w-4 h-4 ${
                                  playingAgentId === agent._id && audioUrl
                                    ? "text-red-500"
                                    : "text-gray-600"
                                }`}
                              />
                            ) : (
                              <FiVolume2 className="w-4 h-4 text-gray-600 hover:text-gray-800" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm font-medium text-gray-800 flex-1">
                            {agent.firstMessage || "Not specified"}
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

                  {/* Description */}
                  <div>
                    <label className="block font-semibold text-gray-700">
                      Description
                    </label>
                    <p className="text-gray-600 text-sm leading-relaxed italic truncate overflow-hidden whitespace-nowrap">
                      "{agent.description}"
                    </p>
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
        clientId={clientId}
        onEdit={onEdit}
      />

      {/* Call History Modal (standalone) */}
      {showCallHistoryModal && historyAgent && (
        <div className="fixed top-0 right-0 bottom-0 left-64 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 m-0">
                Call History - {historyAgent.agentName}
              </h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowCallHistoryModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-0">
              <CallLogs agentId={historyAgent._id} clientId={clientId} />
            </div>
          </div>
        </div>
      )}

      {/* Voice Chat Modal - Pure Voice-to-Voice Interface - AGENT LIST MODAL */}
      {showVoiceChatModal && selectedAgentForChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    Voice Chat with {selectedAgentForChat.agentName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <div className="flex items-center gap-1">
                      {wsConnectionStatus === "connected" ? (
                        <>
                          <FiWifi className="w-3 h-3" />
                          <span className="text-green-200">Connected</span>
                        </>
                      ) : wsConnectionStatus === "connecting" ? (
                        <>
                          <FiLoader className="w-3 h-3 animate-spin" />
                          <span className="text-yellow-200">Connecting...</span>
                        </>
                      ) : (
                        <>
                          <FiWifiOff className="w-3 h-3" />
                          <span className="text-red-200">Disconnected</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs">
                      {isAudioStreaming ? (
                        <span className="text-green-200">
                          🎤 Active: {audioStats.chunksRecorded} chunks
                          generated, {audioStats.chunksSent} sent
                        </span>
                      ) : (
                        <span className="text-gray-300">🎤 Inactive</span>
                      )}
                      {isAITalking && (
                        <span className="text-blue-200 ml-2">
                          🔊 Buffer: {audioBufferQueueRef.current.length} chunks
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeVoiceChat}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="text-xl font-bold">×</span>
                </button>
              </div>
            </div>
            {/* Main Voice Interface */}
            <div className="p-8 flex flex-col items-center justify-center min-h-[500px] space-y-8">
              {/* Connection Status */}
              <div className="text-center">
                <div
                  className={`text-lg font-semibold mb-2 ${
                    wsConnectionStatus === "connected"
                      ? "text-green-600"
                      : wsConnectionStatus === "connecting"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {wsConnectionStatus === "connected"
                    ? "Voice Chat Active - Click mic to disconnect"
                    : wsConnectionStatus === "connecting"
                    ? "Connecting..."
                    : "Click mic to connect"}
                </div>
                <div className="text-gray-600 text-sm">
                  {wsConnectionStatus === "connected"
                    ? "Speak naturally - the AI will respond in real-time"
                    : wsConnectionStatus === "connecting"
                    ? "Please wait while we establish the connection"
                    : "Click the microphone to start voice chat"}
                </div>

                {/* Show reconnection status */}
                {isReconnecting && (
                  <div className="text-yellow-600 text-sm mt-2">
                    🔄 Reconnecting... (Attempt {reconnectAttempts}/
                    {maxReconnectAttempts})
                  </div>
                )}

                {/* Show last disconnect reason */}
                {wsConnectionStatus === "disconnected" &&
                  lastDisconnectReason && (
                    <div className="text-red-600 text-xs mt-1">
                      Last disconnect: {lastDisconnectReason}
                    </div>
                  )}
              </div>

              {/* Large Microphone Visualization */}
              <div className="relative">
                {/* Main microphone circle - clickable to connect/disconnect */}
                <button
                  onClick={() => {
                    addDebugLog(
                      `Mic clicked - Current state: isAudioStreaming=${isAudioStreaming}, isStoppingAudio=${isStoppingAudio}, wsStatus=${wsConnectionStatus}, justConnected=${justConnected}`,
                      "info"
                    );

                    if (wsConnectionStatus === "connected") {
                      if (isAudioStreaming) {
                        // If already streaming, stop audio streaming
                        addDebugLog(
                          "Mic clicked while streaming - stopping audio...",
                          "info"
                        );
                        setIsStoppingAudio(true);
                        addDebugLog("Set stopping state to true", "info");
                        stopContinuousAudioStreaming();
                        // Force immediate state update to ensure UI reflects the change
                        setTimeout(() => {
                          if (isAudioStreaming) {
                            addDebugLog(
                              "Forcing isAudioStreaming to false",
                              "warning"
                            );
                            setIsAudioStreaming(false);
                          }
                          setIsStoppingAudio(false);
                          addDebugLog("Set stopping state to false", "info");
                        }, 100);
                      } else if (justConnected) {
                        // If just connected and not streaming, start audio streaming
                        addDebugLog(
                          "Mic clicked after connection - starting audio streaming...",
                          "info"
                        );
                        setJustConnected(false);
                        startContinuousAudioStreaming();
                        addDebugLog(
                          "Started audio streaming after mic click",
                          "info"
                        );
                      } else {
                        // If connected but not streaming and not just connected, disconnect WebSocket
                        addDebugLog(
                          "Mic clicked while connected but not streaming - disconnecting WebSocket...",
                          "info"
                        );
                        disconnectWebSocket();
                        addDebugLog(
                          "Disconnected from WebSocket via mic click",
                          "info"
                        );
                      }
                    } else {
                      // If not connected, connect
                      connectToWebSocket(false, selectedAgentForChat);
                      setJustConnected(true);
                      addDebugLog(
                        "Connected to WebSocket via mic click",
                        "info"
                      );

                      // Don't start audio streaming automatically - wait for user to click mic again
                      addDebugLog(
                        "WebSocket connected. Click the microphone again to start audio streaming.",
                        "info"
                      );
                    }
                  }}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 ${
                    isStoppingAudio
                      ? "bg-red-500 scale-95"
                      : isAudioStreaming
                      ? "bg-green-500 scale-110"
                      : wsConnectionStatus === "connected"
                      ? "bg-blue-600"
                      : "bg-gray-400"
                  }`}
                  title={
                    isStoppingAudio
                      ? "Stopping audio..."
                      : wsConnectionStatus === "connected"
                      ? isAudioStreaming
                        ? "Click to stop audio"
                        : justConnected
                        ? "Click to start audio"
                        : "Click to disconnect"
                      : "Click to connect"
                  }
                >
                  {isStoppingAudio ? (
                    <div className="w-12 h-12 text-white flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <FiMic className="w-12 h-12 text-white" />
                  )}
                </button>

                {/* Microphone level indicator rings */}
                {isAudioStreaming && (
                  <>
                    <div
                      className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping"
                      style={{
                        animationDuration: "2s",
                        opacity: Math.min(0.8, micLevel / 100),
                      }}
                    />
                    <div
                      className="absolute inset-[-8px] rounded-full border-2 border-green-200 animate-pulse"
                      style={{
                        animationDuration: "1.5s",
                        opacity: Math.min(0.6, micLevel / 100),
                      }}
                    />
                  </>
                )}

                {/* Simple connection status indicator */}
                {wsConnectionStatus === "connected" && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}

                {/* AI Talking indicator */}
                {isAITalking && (
                  <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-3 bg-white rounded animate-pulse"></div>
                      <div
                        className="w-1 h-3 bg-white rounded animate-pulse"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1 h-3 bg-white rounded animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="ml-1">AI Speaking</span>
                  </div>
                )}

                {/* Microphone level bar */}
                {isAudioStreaming && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-100 ease-out rounded-full"
                      style={{ width: `${Math.min(100, micLevel)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status Messages */}
              <div className="text-center space-y-2">
                {isStoppingAudio ? (
                  <div className="text-red-600 font-medium">
                    🔴 Stopping audio stream...
                  </div>
                ) : wsConnectionStatus === "connected" && isAudioStreaming ? (
                  <div className="text-green-600 font-medium">
                    🎤 Listening... Speak to the AI
                  </div>
                ) : wsConnectionStatus === "connected" && !isAudioStreaming ? (
                  <div className="text-blue-600 font-medium">
                    {justConnected
                      ? "🎤 Click microphone to start audio streaming"
                      : "🎤 Click microphone to disconnect"}
                  </div>
                ) : wsConnectionStatus === "connecting" ? (
                  <div className="text-yellow-600 font-medium">
                    🔄 Establishing voice connection...
                  </div>
                ) : (
                  <div className="text-red-600 font-medium">
                    🎤 Click microphone to connect
                  </div>
                )}

                {/* AI Status Messages */}
                {aiStatus === "listening" && (
                  <div className="text-blue-600 font-medium">
                    👂 AI is listening...
                  </div>
                )}

                {aiStatus === "thinking" && (
                  <div className="text-purple-600 font-medium">
                    🤔 AI is thinking...
                  </div>
                )}

                {aiStatus === "speaking" && (
                  <div className="text-green-600 font-medium">
                    🔊 AI is speaking...
                  </div>
                )}

                {aiStatus === "idle" && isUserSpeaking && (
                  <div className="text-yellow-600 font-medium">
                    ⏳ Waiting for your question...
                  </div>
                )}

                {/* Fallback for old isAITalking state */}
                {isAITalking && aiStatus === "idle" && (
                  <div className="text-blue-600">🔊 AI is responding...</div>
                )}
              </div>

              {/* Manual Controls for Debugging and Reconnection */}
              <div className="flex flex-wrap gap-4 text-sm justify-center">
                {wsConnectionStatus === "disconnected" && !isReconnecting && (
                  <button
                    onClick={manualReconnect}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Connect
                  </button>
                )}
              </div>

              {/* Audio Stats */}
              {isAudioStreaming && (
                <div className="text-center text-xs text-gray-500 space-y-1">
                  <div>
                    <span className="font-medium">Audio Processing:</span>{" "}
                    {audioStats.chunksRecorded} chunks generated |
                    <span className="font-medium text-green-600">
                      {" "}
                      {audioStats.chunksSent} sent
                    </span>{" "}
                    |{audioStats.bytesProcessed} bytes total
                  </div>
                  {audioStats.lastChunkTime && (
                    <div>Last Activity: {audioStats.lastChunkTime}</div>
                  )}
                  <div className="text-xs text-blue-600">
                    {audioStats.chunksRecorded > 0 &&
                    audioStats.chunksSent === 0
                      ? "⚠️ Generating audio but WebSocket not ready"
                      : audioStats.chunksSent > 0
                      ? "✅ Successfully streaming to server"
                      : "🔄 Initializing audio capture..."}
                  </div>
                </div>
              )}
            </div>

            {/* Debug Panel (Collapsible) */}
            <div className="border-t border-gray-200">
              <details className="group">
                <summary className="px-3 py-2 cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-800 flex items-center gap-2">
                  <span>Debug Logs</span>
                  <span className="text-xs">({debugLogs.length} entries)</span>
                  {reconnectAttempts > 0 && (
                    <span className="text-xs text-yellow-600">
                      | Reconnect attempts: {reconnectAttempts}/
                      {maxReconnectAttempts}
                    </span>
                  )}
                </summary>
                <div className="px-3 pb-2 max-h-32 overflow-y-auto bg-gray-50 border-t border-gray-100">
                  <div className="font-mono text-xs space-y-1 pt-2">
                    {debugLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.type === "error"
                            ? "text-red-600"
                            : log.type === "success"
                            ? "text-green-600"
                            : log.type === "warning"
                            ? "text-yellow-600"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="text-gray-400">[{log.timestamp}]</span>{" "}
                        {log.message}
                      </div>
                    ))}
                    {debugLogs.length === 0 && (
                      <div className="text-gray-400 italic">
                        Debug logs will appear here...
                      </div>
                    )}
                  </div>
                </div>
              </details>
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
                    {callStage === "input" &&
                      `AI Call by agent ${selectedAgentForCall.agentName}`}
                    {callStage === "connecting" && "Connecting..."}
                    {callStage === "connected" && `Call in Progress`}
                    {callStage === "timeout" && "Connection Timeout"}
                    {callStage === "terminated" && "Call Ended"}
                  </h3>
                  {/* Context chips: contact name, phone, agent */}
                  <div className="mt-1 flex flex-wrap gap-2 text-s">
                    {contactName && (
                      <span className="inline-flex items-center gap-1 text-white">
                        Contact name: {contactName}
                      </span>
                    )}
                  </div>
                  {/* Call Duration Display in Header */}
                  {(callStage === "connecting" ||
                    callStage === "connected" ||
                    callStage === "timeout") &&
                    callDuration > 0 && (
                      <div className="text-sm text-green-100 mt-1 font-mono">
                        ⏱️ {formatCallDuration(callDuration)}
                      </div>
                    )}
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
                      User Name
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
                      User Phone Number
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
                  {/* Recent calls quick fill */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Recent
                      </label>
                      {recentCallsLoading && (
                        <span className="text-xs text-gray-500">Loading…</span>
                      )}
                    </div>
                    {recentCalls.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {recentCalls.map((rc, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setPhoneNumber(rc.phoneNumber);
                              if (rc.contactName)
                                setContactName(rc.contactName);
                            }}
                            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-800 border border-gray-200"
                            title={`${rc.contactName || "Unknown"} • ${
                              rc.phoneNumber
                            }`}
                          >
                            <span className="font-medium">
                              {rc.contactName || "Unknown"}
                            </span>
                            <span className="text-gray-500 ml-2">
                              {rc.phoneNumber}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        No recent calls
                      </div>
                    )}
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
                    <p className="text-gray-600 mb-3">
                      Establishing connection to {phoneNumber}
                    </p>
                    {/* Call Duration during connection - Only show when timer is running */}
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
                      {/* Show polling status */}
                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        🔄 Live monitoring
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Call Duration - Only show when timer is running */}
                      {callDuration > 0 && (
                        <div className="text-sm text-green-600 font-mono">
                          ⏱️ {formatCallDuration(callDuration)}
                        </div>
                      )}
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>

                  {/* End Call Button - Only show when call is active and not terminated */}
                  {callStage === "connected" && !isTerminatingCall && (
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={terminateCall}
                        disabled={isTerminatingCall}
                        className={`px-8 py-3 text-white rounded-lg transition-colors font-medium ${
                          isTerminatingCall
                            ? "bg-red-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FiPhoneCall className="w-5 h-5" />
                          End Call
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Show terminating status when call is being terminated */}
                  {isTerminatingCall && (
                    <div className="flex justify-center space-x-4">
                      <div className="px-8 py-3 bg-red-400 text-white rounded-lg font-medium flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Terminating Call...
                      </div>
                    </div>
                  )}

                  {/* Live Transcript - Show for all stages except input */}
                  {callStage !== "input" && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700">
                        {callStage === "terminated"
                          ? "Call History"
                          : "Live Transcript"}
                      </div>
                      <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
                        {liveTranscriptLines.length === 0 ? (
                          <div className="text-gray-500 text-sm">
                            Waiting for conversation...
                          </div>
                        ) : (
                          <>
                            {liveTranscriptLines.map((line, idx) => {
                              const isUser = line.includes("] User (");
                              const text = line
                                // Remove full prefix like: [timestamp] User (xyz):
                                .replace(
                                  /^\[[^\]]+\]\s(User|AI)\s\([^\)]+\):\s*/,
                                  ""
                                )
                                // Also remove only a leading [timestamp] if present
                                .replace(/^\[[^\]]+\]\s*/, "");

                              // Extract timestamp from the line if available, otherwise use current time
                              let messageTime = new Date();
                              const timestampMatch = line.match(/\[([^\]]+)\]/);
                              if (timestampMatch) {
                                try {
                                  // Try to parse the timestamp from the log format
                                  const timestampStr = timestampMatch[1];
                                  if (
                                    timestampStr.includes("T") ||
                                    timestampStr.includes("-")
                                  ) {
                                    messageTime = new Date(timestampStr);
                                  } else {
                                    // If it's a simple timestamp, use current time
                                    messageTime = new Date();
                                  }
                                } catch (e) {
                                  // If parsing fails, use current time
                                  messageTime = new Date();
                                }
                              }

                              // Format time using the new function for better display
                              const timeString = formatMessageTime(messageTime);

                              return (
                                <div
                                  key={idx}
                                  className={`flex mb-2 ${
                                    isUser ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                                      isUser
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-100 text-gray-800"
                                    } relative`}
                                  >
                                    <div className="mb-1">{text}</div>
                                    <div
                                      className={`text-xs ${
                                        isUser
                                          ? "text-green-100"
                                          : "text-gray-500"
                                      } text-right flex items-center gap-1`}
                                    >
                                      {timeString}
                                      {/* Show checkmark for user messages to indicate delivery */}
                                      {isUser && (
                                        <span className="text-green-200">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* AI Typing Indicator - Show when there's recent activity but no new AI message */}
                            {liveTranscriptLines.length > 0 && (
                              <div className="flex mb-2 justify-start">
                                <div className="max-w-[80%] px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-800 relative">
                                  <div className="flex items-center gap-2">
                                    <div className="flex space-x-1">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                      <div
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.1s" }}
                                      ></div>
                                      <div
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.2s" }}
                                      ></div>
                                    </div>
                                    <span className="text-gray-500 text-xs">
                                      AI is speaking
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400 text-right mt-1">
                                    {new Date().toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {callStage === "timeout" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <FiAlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <FiX className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Connection Timeout
                    </h4>
                    <p className="text-gray-600 mb-3">
                      No activity detected within 40 seconds. The call may not
                      have connected properly.
                    </p>
                    {/* Call Duration at timeout - Only show when timer was running */}
                    {callDuration > 0 && (
                      <div className="text-sm text-red-600 font-mono bg-red-50 px-3 py-1 rounded-md border border-red-200 mb-4">
                        ⏱️ {formatCallDuration(callDuration)}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      <p>Possible reasons:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Phone number may be incorrect</li>
                        <li>Recipient may not have answered</li>
                        <li>Network connectivity issues</li>
                        <li>Service temporarily unavailable</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={cancelCall}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        // Clear any previous timeout and immediately redial
                        if (callTimeoutRef.current) {
                          clearTimeout(callTimeoutRef.current);
                          callTimeoutRef.current = null;
                        }
                        if (phoneNumber && selectedAgentForCall) {
                          initiateCall();
                        }
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      title="Call again"
                    >
                      <FiPhoneCall className="w-5 h-5" />
                      Call again
                    </button>
                  </div>
                </div>
              )}

              {callStage === "terminated" && (
                <div className="space-y-4">
                  {/* Simple termination header */}
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-red-700 font-medium">
                        Call Ended
                      </span>
                      {callDuration > 0 && (
                        <div className="text-sm text-red-600 font-mono">
                          ⏱️ {formatCallDuration(callDuration)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!phoneNumber || !selectedAgentForCall) return;
                          initiateCall();
                        }}
                        title="Redial same number"
                        className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path d="M2 5a1 1 0 011-1h3a1 1 0 011 .78l.72 3.23a1 1 0 01-.27.95l-1.72 1.72a15.94 15.94 0 007.07 7.07l1.72-1.72a1 1 0 01.95-.27l3.23.72A1 1 0 0120 18v3a1 1 0 01-1 1c-9.39 0-17-7.61-17-17z" />
                          <path d="M13.5 6a.75.75 0 010-1.5h5.19l-1.72-1.72a.75.75 0 111.06-1.06l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06L18.69 6H13.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={cancelCall}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Call Logs/Transcripts - Show after call termination */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700">
                      Call History
                    </div>
                    <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
                      {liveTranscriptLines.length === 0 ? (
                        <div className="text-gray-500 text-sm">
                          No call logs available...
                        </div>
                      ) : (
                        <>
                          {liveTranscriptLines.map((line, idx) => {
                            const isUser = line.includes("] User (");
                            const text = line
                              // Remove full prefix like: [timestamp] User (xyz):
                              .replace(
                                /^\[[^\]]+\]\s(User|AI)\s\([^\)]+\):\s*/,
                                ""
                              )
                              // Also remove only a leading [timestamp] if present
                              .replace(/^\[[^\]]+\]\s*/, "");

                            // Extract timestamp from the line if available, otherwise use current time
                            let messageTime = new Date();
                            const timestampMatch = line.match(/\[([^\]]+)\]/);
                            if (timestampMatch) {
                              try {
                                // Try to parse the timestamp from the log format
                                const timestampStr = timestampMatch[1];
                                if (
                                  timestampStr.includes("T") ||
                                  timestampStr.includes("-")
                                ) {
                                  messageTime = new Date(timestampStr);
                                } else {
                                  // If it's a simple timestamp, use current time
                                  messageTime = new Date();
                                }
                              } catch (e) {
                                // If parsing fails, use current time
                                messageTime = new Date();
                              }
                            }

                            // Format time using the new function for better display
                            const timeString = formatMessageTime(messageTime);

                            return (
                              <div
                                key={idx}
                                className={`flex mb-2 ${
                                  isUser ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                                    isUser
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-100 text-gray-800"
                                  } relative`}
                                >
                                  <div className="mb-1">{text}</div>
                                  <div
                                    className={`text-xs ${
                                      isUser
                                        ? "text-green-100"
                                        : "text-gray-500"
                                    } text-right flex items-center gap-1`}
                                  >
                                    {timeString}
                                    {/* Show checkmark for user messages to indicate delivery */}
                                    {isUser && (
                                      <span className="text-green-200">✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
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
