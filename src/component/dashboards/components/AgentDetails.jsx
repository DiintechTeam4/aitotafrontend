"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiArrowLeft,
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
  FiArrowUpRight,
  FiRefreshCw,
} from "react-icons/fi";
import { API_BASE_URL } from "../../../config";
import QRCode from "qrcode";

// Working QR Code Component (client-side QR generation)
const WorkingQRCode = ({ value, size = 200, bgColor = "#fff", fgColor = "#000" }) => {
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

const AgentDetails = ({ agent, isOpen, onClose, clientId, forceVoiceChatModal }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showVoiceChatModal, setShowVoiceChatModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [callStage, setCallStage] = useState("input");
  const [micLevel, setMicLevel] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [callMessages, setCallMessages] = useState([]);
  const [isCallRecording, setIsCallRecording] = useState(false);
  const [callMicLevel, setCallMicLevel] = useState(0);
  // Live logs state
  const [dialUniqueId, setDialUniqueId] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveTranscriptLines, setLiveTranscriptLines] = useState([]);
  const logsPollRef = useRef(null);

  // WebSocket related states
  const [wsConnection, setWsConnection] = useState(null);
  const [wsConnectionStatus, setWsConnectionStatus] = useState('disconnected');
  const [isAITalking, setIsAITalking] = useState(false);
  const [streamSid, setStreamSid] = useState(null);
  const [isAudioStreaming, setIsAudioStreaming] = useState(false);
  
  // Reconnection states
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [maxReconnectAttempts] = useState(5);
  const [reconnectDelay, setReconnectDelay] = useState(1000);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastDisconnectReason, setLastDisconnectReason] = useState('');
  
  // Speech detection states
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [userSpeechEnded, setUserSpeechEnded] = useState(false);
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle', 'listening', 'thinking', 'speaking'

  // Debug states
  const [debugLogs, setDebugLogs] = useState([]);
  const [audioStats, setAudioStats] = useState({
    chunksRecorded: 0,
    chunksSent: 0,
    bytesProcessed: 0,
    lastChunkTime: null,
    streamingActive: false
  });

  // Audio context and processing refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
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

  const callTimerRef = useRef(null);

  // Debug logging function
  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    console.log(`[${type.toUpperCase()}] ${timestamp}: ${message}`);
    setDebugLogs(prev => [...prev.slice(-19), logEntry]);
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

  // Enhanced WebSocket connection management with reconnection
  const connectToWebSocket = (isReconnect = false) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      addDebugLog('WebSocket already connected', 'info');
      return;
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (isReconnect) {
      setIsReconnecting(true);
      addDebugLog(`Reconnection attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts}`, 'info');
    } else {
      setReconnectAttempts(0);
      reconnectAttemptsRef.current = 0;
    }

    setWsConnectionStatus('connecting');
    addDebugLog('Attempting WebSocket connection...', 'info');
    
    // Use the correct WebSocket URL format that matches your server
    const wsUrl = `wss://test.aitota.com/ws`;
    addDebugLog(`Connecting to: ${wsUrl}`, 'info');
    
    const ws = new WebSocket(wsUrl);
    
    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        addDebugLog('WebSocket connection timeout', 'error');
        ws.close();
        handleConnectionFailure('Connection timeout');
      }
    }, 10000); // 10 second timeout
    
    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      addDebugLog('WebSocket connected successfully', 'success');
      setWsConnectionStatus('connected');
      setIsReconnecting(false);
      setReconnectAttempts(0);
      reconnectAttemptsRef.current = 0;
      setReconnectDelay(1000); // Reset delay
      setLastDisconnectReason('');
      
      // Generate a unique stream ID
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setStreamSid(streamId);
      
      // Send the start message in the format expected by your server
      const startMessage = {
        event: 'start',
        streamSid: streamId,
        start: {
          accountSid: agent.accountSid || 'default_account',
          streamSid: streamId,
          from: clientId,
          to: agent.callerId,
          extraData: btoa(JSON.stringify({
            agentId: agent._id,
            agentName: agent.agentName,
            clientId: clientId,
            CallDirection: "InDial" // This will be treated as inbound
          }))
        }
      };
      
      addDebugLog(`Sending start message: ${JSON.stringify(startMessage)}`, 'info');
      ws.send(JSON.stringify(startMessage));
      
      // Set the WebSocket connection AFTER sending the start message
      setWsConnection(ws);
      wsConnectionRef.current = ws;
      streamSidRef.current = streamId;
      
      // Start audio streaming after connection is established and start message sent
      setTimeout(() => {
        startContinuousAudioStreaming();
      }, 1000);
      
      // Retry audio streaming start if it fails initially
      setTimeout(() => {
        if (!isStreamingActiveRef.current && wsConnectionRef.current && wsConnectionRef.current.readyState === WebSocket.OPEN) {
          addDebugLog('Retrying audio streaming start...', 'info');
          startContinuousAudioStreaming();
        }
      }, 3000);
      
      // Also trigger a manual audio context resume
      setTimeout(() => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            addDebugLog('Audio context manually resumed', 'success');
          });
        }
      }, 1500);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addDebugLog(`Received WebSocket message: ${data.event}`, 'info');
        handleWebSocketMessage(data);
      } catch (error) {
        addDebugLog(`Error parsing WebSocket message: ${error.message}`, 'error');
      }
    };
    
    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      addDebugLog(`WebSocket error: ${error}`, 'error');
      setWsConnectionStatus('disconnected');
      setIsReconnecting(false);
    };
    
    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      const reason = event.reason || `Code: ${event.code}`;
      addDebugLog(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`, 'warning');
      setWsConnectionStatus('disconnected');
      setWsConnection(null);
      wsConnectionRef.current = null;
      setStreamSid(null);
      streamSidRef.current = null;
      setLastDisconnectReason(reason);
      stopContinuousAudioStreaming();
      
      // Attempt reconnection if not manually closed
      if (event.code !== 1000 && event.code !== 1001) { // Not normal closure
        handleConnectionFailure(reason);
      }
    };
  };

  // Handle connection failures and implement reconnection logic
  const handleConnectionFailure = (reason) => {
    setLastDisconnectReason(reason);
    
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000); // Max 30 seconds
      
      addDebugLog(`Connection failed: ${reason}. Reconnecting in ${delay/1000}s...`, 'warning');
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        setReconnectAttempts(reconnectAttemptsRef.current);
        connectToWebSocket(true);
      }, delay);
    } else {
      addDebugLog(`Max reconnection attempts (${maxReconnectAttempts}) reached. Please reconnect manually.`, 'error');
      setIsReconnecting(false);
    }
  };

  // Manual reconnect function
  const manualReconnect = () => {
    addDebugLog('Manual reconnection initiated', 'info');
    
    // Reset reconnection state
    setReconnectAttempts(0);
    reconnectAttemptsRef.current = 0;
    setReconnectDelay(1000);
    setIsReconnecting(false);
    
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
      case 'connected':
        addDebugLog('WebSocket session connected', 'success');
        break;
        
      case 'start':
        addDebugLog(`Session started with streamSid: ${data.streamSid}`, 'success');
        setStreamSid(data.streamSid);
        break;
        
      case 'media':
        if (data.media && data.media.payload) {
          addDebugLog(`Received audio chunk: ${data.media.payload.length} chars`, 'info');
          
          // Minimal receiving indicator - no state updates that could affect audio
          addDebugLog(`Received audio chunk: ${data.media.payload.length} chars`, 'info');
          
          playAudioChunk(data.media.payload);
        }
        break;
        
      case 'stop':
        addDebugLog('Session stopped by server', 'info');
        break;
        
      case 'error':
        addDebugLog(`Server error: ${data.message || 'Unknown error'}`, 'error');
        break;
        
      default:
        addDebugLog(`Unknown WebSocket event: ${data.event}`, 'warning');
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
    
    if (wsConnectionRef.current) {
      addDebugLog('Disconnecting WebSocket...', 'info');
      wsConnectionRef.current.send(JSON.stringify({
        event: 'stop',
        streamSid: streamSidRef.current
      }));
      
      wsConnectionRef.current.close(1000, 'Manual disconnect'); // Normal closure
      setWsConnection(null);
      wsConnectionRef.current = null;
      setWsConnectionStatus('disconnected');
      setStreamSid(null);
      streamSidRef.current = null;
    }
    stopContinuousAudioStreaming();
  };

  // Continuous audio streaming
  const startContinuousAudioStreaming = async () => {
    try {
      if (isStreamingActiveRef.current) {
        addDebugLog('Audio streaming already active', 'warning');
        return;
      }

      // Check if WebSocket is ready before starting audio streaming
      if (!wsConnectionRef.current || wsConnectionRef.current.readyState !== WebSocket.OPEN) {
        addDebugLog('WebSocket not ready, cannot start audio streaming', 'error');
        return;
      }

      if (!streamSidRef.current) {
        addDebugLog('No streamSid available, cannot start audio streaming', 'error');
        return;
      }

      addDebugLog('Starting continuous audio streaming...', 'info');

      // Request microphone permission with higher sample rate
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000, // Use browser's native sample rate
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        } 
      });

      streamRef.current = stream;
      addDebugLog('Microphone access granted for continuous streaming', 'success');

      // Create audio context with browser's default sample rate
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      addDebugLog(`Audio context created with sample rate: ${audioContextRef.current.sampleRate}`, 'info');
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create analyzer for visual feedback
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Use ScriptProcessorNode for reliable audio processing
      const bufferSize = 4096; // Larger buffer for more stable processing
      const scriptProcessor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
      
      let sampleBuffer = [];
      const targetSampleRate = 8000; // Target sample rate for server
      const downsampleRatio = audioContextRef.current.sampleRate / targetSampleRate;
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
        streamingActive: true
      });
      
      // Start visual feedback
      updateMicLevel();
      
      addDebugLog('Continuous audio streaming started successfully', 'success');
      
    } catch (error) {
      addDebugLog(`Error starting continuous audio streaming: ${error.message}`, 'error');
      isStreamingActiveRef.current = false;
      setIsAudioStreaming(false);
    }
  };

  const stopContinuousAudioStreaming = () => {
    addDebugLog('Stopping continuous audio streaming...', 'info');
    
    isStreamingActiveRef.current = false;
    setIsAudioStreaming(false);
    setMicLevel(0);

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebugLog('Microphone track stopped', 'info');
      });
      streamRef.current = null;
    }

    // Cleanup audio processor
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
      addDebugLog('ScriptProcessor disconnected', 'info');
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
      addDebugLog('Audio context closed', 'info');
    }

    // Reset refs
    analyserRef.current = null;
    microphoneRef.current = null;
    dataArrayRef.current = null;

    setAudioStats(prev => ({
      ...prev,
      streamingActive: false
    }));

    addDebugLog(`Continuous streaming stopped. Final stats: ${audioStats.chunksRecorded} chunks recorded, ${audioStats.chunksSent} chunks sent, ${audioStats.bytesProcessed} bytes processed`, 'success');
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
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binaryString);
      
      // Get current WebSocket connection and streamSid from refs to avoid stale closures
      const currentWs = wsConnectionRef.current;
      const currentStreamSid = streamSidRef.current;
      
      // Update stats first (this will always happen)
      setAudioStats(prev => ({
        chunksRecorded: prev.chunksRecorded + 1,
        chunksSent: currentWs && currentWs.readyState === WebSocket.OPEN ? prev.chunksSent + 1 : prev.chunksSent,
        bytesProcessed: prev.bytesProcessed + 160,
        lastChunkTime: new Date().toLocaleTimeString(),
        streamingActive: true
      }));
      
      // Send via WebSocket only if connection is ready
      if (currentWs && currentWs.readyState === WebSocket.OPEN && currentStreamSid) {
        const mediaMessage = {
          event: 'media',
          streamSid: currentStreamSid,
          media: {
            payload: base64Audio
          }
        };
        
        currentWs.send(JSON.stringify(mediaMessage));
        
        // Minimal sending indicator - no state updates that could affect audio
        if (audioStats.chunksSent % 25 === 0) {
          addDebugLog(`Sent audio chunk #${audioStats.chunksSent + 1}`, 'info');
        }
        
        // Log every 25th chunk to show activity
        setAudioStats(prev => {
          if (prev.chunksSent % 25 === 0) {
            addDebugLog(`Sent audio chunk #${prev.chunksSent + 1} (160 bytes, ${base64Audio.length} chars base64)`, 'info');
          }
          return prev;
        });
      } else {
        // Log connection issues with more detail
        if (!currentWs) {
          addDebugLog('No WebSocket connection - audio chunk generated but not sent', 'warning');
        } else if (currentWs.readyState !== WebSocket.OPEN) {
          const stateNames = {
            0: 'CONNECTING',
            1: 'OPEN',
            2: 'CLOSING',
            3: 'CLOSED'
          };
          addDebugLog(`WebSocket not ready (state: ${stateNames[currentWs.readyState] || currentWs.readyState}) - audio chunk generated but not sent`, 'warning');
        } else if (!currentStreamSid) {
          addDebugLog('No streamSid - audio chunk generated but not sent', 'warning');
        }
      }
      
    } catch (error) {
      addDebugLog(`Error processing audio data: ${error.message}`, 'error');
    }
  };

  const updateMicLevel = () => {
    if (!isStreamingActiveRef.current || !analyserRef.current) return;

    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
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
        setAiStatus('listening');
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
          if (silenceDuration > 1200) { // > 1.2s = user probably done
            setUserSpeechEnded(true);
            setIsUserSpeaking(false);
            setAiStatus('idle');
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
      addDebugLog(`Received audio chunk: ${base64Audio.length} chars`, 'info');
      
      if (!audioPlaybackContextRef.current) {
        audioPlaybackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 8000
        });
        addDebugLog('Audio playback context created', 'info');
      }

      const audioContext = audioPlaybackContextRef.current;
      
      // Ensure audio context is running
      if (audioContext.state === 'suspended') {
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
        timestamp: Date.now()
      });
      
      // Limit buffer size to prevent memory issues (keep last 100 chunks = ~4 seconds)
      if (audioBufferQueueRef.current.length > 100) {
        audioBufferQueueRef.current = audioBufferQueueRef.current.slice(-100);
        addDebugLog('Buffer queue trimmed to prevent memory overflow', 'info');
      }
      
      // Start playback if not already playing
      if (!isPlayingRef.current) {
        // Show "thinking" status if user had finished speaking
        if (userSpeechEnded) {
          setAiStatus('thinking');
          
          // Short delay before showing "speaking"
          setTimeout(() => {
            setAiStatus('speaking');
          }, 100);
        } else {
          setAiStatus('speaking');
        }
        
        startContinuousPlayback();
      }
      
    } catch (error) {
      addDebugLog(`Error processing audio chunk: ${error.message}`, 'error');
    }
  };

  // Start continuous audio playback
  const startContinuousPlayback = async () => {
    if (isPlayingRef.current) return;
    
    try {
      isPlayingRef.current = true;
      setIsAITalking(true);
      setAiStatus('speaking');
      
      const audioContext = audioPlaybackContextRef.current;
      if (!audioContext) return;
      
      // Ensure audio context is running
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Initialize playback timing with a small delay to ensure smooth start
      const startDelay = 0.1; // 100ms delay
      playbackStartTimeRef.current = audioContext.currentTime + startDelay;
      nextPlayTimeRef.current = audioContext.currentTime + startDelay;
      
      addDebugLog(`Starting continuous audio playback with ${startDelay}s delay`, 'success');
      
      // Start the playback loop
      setTimeout(() => {
        scheduleNextChunk();
      }, startDelay * 150);
      
    } catch (error) {
      addDebugLog(`Error starting continuous playback: ${error.message}`, 'error');
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
      setAiStatus('idle');
      setUserSpeechEnded(false);
      addDebugLog('Audio playback queue empty, stopping', 'info');
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
    const timeUntilNext = (nextPlayTimeRef.current - audioContext.currentTime) * 1000;
    setTimeout(() => {
      scheduleNextChunk();
    }, Math.max(0, timeUntilNext - 20)); // 20ms buffer for batch processing
    
    // Log every 25th chunk (approximately every second)
    if (queue.length % 25 === 0) {
      addDebugLog(`Playing chunks, queue length: ${queue.length}, processed: ${chunksToProcess}`, 'info');
    }
  };

  // Stop continuous audio playback
  const stopContinuousPlayback = () => {
    isPlayingRef.current = false;
    setIsAITalking(false);
    audioBufferQueueRef.current = [];
    nextPlayTimeRef.current = 0;
    addDebugLog('Continuous audio playback stopped', 'info');
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
    
    // Clear debug logs
    setDebugLogs([]);
    addDebugLog('Voice chat modal opened', 'info');
    
    // Connect to WebSocket when opening voice chat
    connectToWebSocket();
  };

  const closeVoiceChat = () => {
    addDebugLog('Closing voice chat...', 'info');
    setShowVoiceChatModal(false);
    setMicLevel(0);
    setIsAITalking(false);

    // Reset speech detection states
    setIsUserSpeaking(false);
    setUserSpeechEnded(false);
    setAiStatus('idle');

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
    if (audioPlaybackContextRef.current && audioPlaybackContextRef.current.state !== 'closed') {
      audioPlaybackContextRef.current.close();
      audioPlaybackContextRef.current = null;
    }

    // Clear debug logs
    setDebugLogs([]);
  };

  const handleCall = () => {
    setShowCallModal(true);
    setCallStage("input");
  };

  const makeAIDialCall = async (targetPhoneNumber, agentCallerId, agentApiKey, clientUuid, providedUniqueId) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        throw new Error("Client token not found. Please log in.");
      }

      const uniqueId = providedUniqueId || `aidial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const callPayload = {
        transaction_id: "CTI_BOT_DIAL",
        phone_num: targetPhoneNumber.replace(/[^\d]/g, ""),
        uniqueid: uniqueId,
        callerid: agentCallerId,
        uuid: clientUuid,
        custom_param: {
          agentId: agent._id,
          agentName: agent.agentName,
          contactName: contactName || "",
          uniqueid: uniqueId
        },
        resFormat: 3,
      };

      console.log("Sending AI Dial request with payload:", callPayload);

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
      setCallMessages([]);
      // generate and store unique id for correlating logs
      const generatedUniqueId = `aidial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setDialUniqueId(generatedUniqueId);

      const result = await makeAIDialCall(
        phoneNumber,
        agent.callerId,
        agent.X_API_KEY,
        clientId,
        generatedUniqueId
      );

      if (result.success) {
        setCallStage("connected");
        setIsCallConnected(true);
        startLogsPolling(generatedUniqueId);
      } else {
        setCallStage("input");
        setIsCallConnected(false);
        alert(`Failed to initiate call: ${result.error}`);
        console.error("AI Dial initiation failed:", result.error);
      }
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
        if (log && typeof log.transcript === 'string') {
          if (log.transcript !== liveTranscript) {
            setLiveTranscript(log.transcript);
            const lines = log.transcript.split('\n').filter(Boolean);
            setLiveTranscriptLines(lines);
          }
          const active = log?.metadata?.isActive;
          if (active === false) {
            stopLogsPolling();
          }
        }
      } catch (e) {
        // silent
      }
    };
    // immediate and interval
    poll();
    logsPollRef.current = setInterval(poll, 2000);
  };

  const cancelCall = () => {
    setShowCallModal(false);
    setPhoneNumber("");
    setContactName("");
    setCallStage("input");
    setIsCallConnected(false);
    setCallDuration(0);
    setCallMessages([]);
    setIsCallRecording(false);
    setCallMicLevel(0);
    setDialUniqueId("");
    setLiveTranscript("");
    setLiveTranscriptLines([]);
    stopLogsPolling();
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
  };

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

      // Disconnect WebSocket
      disconnectWebSocket();
    };
  }, []);

  if (!isOpen || !agent) return null;

  // Debug: Log API_BASE_URL and QR code value
  // Use frontend origin for QR code
  const qrUrlValue = `${window.location.origin}/agent/${agent?._id}/talk`;
  console.log('QR Code Value:', qrUrlValue);

  // If forceVoiceChatModal is true, always show only the voice chat modal
  if (forceVoiceChatModal) {
    if (!isOpen || !agent) return null;
    return (
      <div className="fixed inset-0 bg-white z-50">
        {/* Voice Chat Modal - Pure Voice-to-Voice Interface (from AgentDetails) */}
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    Voice Chat with {agent.agentName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <div className="flex items-center gap-1">
                      {wsConnectionStatus === 'connected' ? (
                        <>
                          <FiWifi className="w-3 h-3" />
                          <span className="text-green-200">Connected</span>
                        </>
                      ) : wsConnectionStatus === 'connecting' ? (
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
                        <span className="text-green-200">🎤 Active: {audioStats.chunksRecorded} chunks generated, {audioStats.chunksSent} sent</span>
                      ) : (
                        <span className="text-gray-300">🎤 Inactive</span>
                      )}
                      {isAITalking && (
                        <span className="text-blue-200 ml-2">🔊 Buffer: {audioBufferQueueRef.current.length} chunks</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Main Voice Interface */}
            <div className="p-8 flex flex-col items-center justify-center min-h-[500px] space-y-8">
              {/* Connection Status */}
              <div className="text-center">
                <div className={`text-lg font-semibold mb-2 ${
                  wsConnectionStatus === 'connected' ? 'text-green-600' :
                  wsConnectionStatus === 'connecting' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {wsConnectionStatus === 'connected' ? 'Voice Chat Active' :
                   wsConnectionStatus === 'connecting' ? 'Connecting...' :
                   'Connection Failed'}
                </div>
                <div className="text-gray-600 text-sm">
                  {wsConnectionStatus === 'connected' 
                    ? 'Speak naturally - the AI will respond in real-time'
                    : wsConnectionStatus === 'connecting'
                    ? 'Please wait while we establish the connection'
                    : 'Check your connection and try again'
                  }
                </div>
                
                {/* Show reconnection status */}
                {isReconnecting && (
                  <div className="text-yellow-600 text-sm mt-2">
                    🔄 Reconnecting... (Attempt {reconnectAttempts}/{maxReconnectAttempts})
                  </div>
                )}
                
                {/* Show last disconnect reason */}
                {wsConnectionStatus === 'disconnected' && lastDisconnectReason && (
                  <div className="text-red-600 text-xs mt-1">
                    Last disconnect: {lastDisconnectReason}
                  </div>
                )}
              </div>

              {/* Large Microphone Visualization */}
              <div className="relative">
                {/* Main microphone circle */}
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isAudioStreaming
                    ? "bg-green-500 scale-110"
                    : wsConnectionStatus === 'connected'
                    ? "bg-blue-600"
                    : "bg-gray-400"
                }`}>
                  <FiMic className="w-12 h-12 text-white" />
                </div>

                {/* Microphone level indicator rings */}
                {isAudioStreaming && (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping"
                      style={{
                        animationDuration: '2s',
                        opacity: Math.min(0.8, micLevel / 100)
                      }}
                    />
                    <div 
                      className="absolute inset-[-8px] rounded-full border-2 border-green-200 animate-pulse"
                      style={{
                        animationDuration: '1.5s',
                        opacity: Math.min(0.6, micLevel / 100)
                      }}
                    />
                  </>
                )}

                {/* Simple connection status indicator */}
                {wsConnectionStatus === 'connected' && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}

                {/* AI Talking indicator */}
                {isAITalking && (
                  <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-3 bg-white rounded animate-pulse"></div>
                      <div className="w-1 h-3 bg-white rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1 h-3 bg-white rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
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
                {wsConnectionStatus === 'connected' && isAudioStreaming ? (
                  <div className="text-green-600 font-medium">
                    🎤 Listening... Speak to the AI
                  </div>
                ) : wsConnectionStatus === 'connected' && !isAudioStreaming ? (
                  <div className="text-blue-600 font-medium">
                    🔄 Starting audio stream...
                  </div>
                ) : wsConnectionStatus === 'connecting' ? (
                  <div className="text-yellow-600 font-medium">
                    🔄 Establishing voice connection...
                  </div>
                ) : (
                  <div className="text-red-600 font-medium">
                    ❌ Connection failed
                  </div>
                )}
                
                {/* AI Status Messages */}
                {aiStatus === 'listening' && (
                  <div className="text-blue-600 font-medium">
                    👂 AI is listening...
                  </div>
                )}
                
                {aiStatus === 'thinking' && (
                  <div className="text-purple-600 font-medium">
                    🤔 AI is thinking...
                  </div>
                )}
                
                {aiStatus === 'speaking' && (
                  <div className="text-green-600 font-medium">
                    🔊 AI is speaking...
                  </div>
                )}
                
                {aiStatus === 'idle' && isUserSpeaking && (
                  <div className="text-yellow-600 font-medium">
                    ⏳ Waiting for your question...
                  </div>
                )}

                {/* Fallback for old isAITalking state */}
                {isAITalking && aiStatus === 'idle' && (
                  <div className="text-blue-600">
                    🔊 AI is responding...
                  </div>
                )}
              </div>

              {/* Manual Controls for Debugging and Reconnection */}
              <div className="flex flex-wrap gap-4 text-sm justify-center">
                {wsConnectionStatus === 'disconnected' && !isReconnecting && (
                  <button
                    onClick={manualReconnect}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Reconnect
                  </button>
                )}
                
                {wsConnectionStatus === 'connected' && (
                  <>
                    {!isAudioStreaming ? (
                      <button
                        onClick={startContinuousAudioStreaming}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Start Audio Stream
                      </button>
                    ) : (
                      <button
                        onClick={stopContinuousAudioStreaming}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Stop Audio Stream
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                          audioContextRef.current.resume();
                          addDebugLog('Manually resumed audio context', 'info');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Resume Audio Context
                    </button>
                  </>
                )}
              </div>

              {/* Audio Stats */}
              {isAudioStreaming && (
                <div className="text-center text-xs text-gray-500 space-y-1">
                  <div>
                    <span className="font-medium">Audio Processing:</span> {audioStats.chunksRecorded} chunks generated | 
                    <span className="font-medium text-green-600"> {audioStats.chunksSent} sent</span> | 
                    {audioStats.bytesProcessed} bytes total
                  </div>
                  {audioStats.lastChunkTime && (
                    <div>Last Activity: {audioStats.lastChunkTime}</div>
                  )}
                  <div className="text-xs text-blue-600">
                    {audioStats.chunksRecorded > 0 && audioStats.chunksSent === 0 
                      ? "⚠️ Generating audio but WebSocket not ready"
                      : audioStats.chunksSent > 0 
                      ? "✅ Successfully streaming to server"
                      : "🔄 Initializing audio capture..."
                    }
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
                      | Reconnect attempts: {reconnectAttempts}/{maxReconnectAttempts}
                    </span>
                  )}
                </summary>
                <div className="px-3 pb-2 max-h-32 overflow-y-auto bg-gray-50 border-t border-gray-100">
                  <div className="font-mono text-xs space-y-1 pt-2">
                    {debugLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.type === 'error' ? 'text-red-600' :
                          log.type === 'success' ? 'text-green-600' :
                          log.type === 'warning' ? 'text-yellow-600' :
                          'text-gray-700'
                        }`}
                      >
                        <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                      </div>
                    ))}
                    {debugLogs.length === 0 && (
                      <div className="text-gray-400 italic">Debug logs will appear here...</div>
                    )}
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 ml-64">
      <div className="h-full overflow-y-auto">
        {/* Updated Header */}
        <div className="bg-gradient-to-r from-gray-800 to-black px-6 py-2">
          <div className="flex justify-between items-start">
            {/* Left Side - Agent Information */}
            <div className="flex items-start gap-4">
              {/* Back Arrow */}
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors mt-1"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>

              {/* Agent Details */}
              <div className="space-y-3">
                {/* Agent Name */}
                <div>
                  <h2 className="text-white font-bold text-2xl capitalize">
                    {agent.agentName}
                  </h2>
                </div>

                {/* Agent ID */}
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide mr-2">Agent ID:</span>
                    <span className="text-gray-300 text-sm">
                      {agent._id}
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-center gap-2">
                  <FiTag className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide mr-2">Category:</span>
                    <span className="text-gray-300 text-sm">
                      {agent.category || "Not specified"}
                    </span>
                  </div>
                </div>

                {/* Personality */}
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide mr-2">Personality:</span>
                    <span className="text-gray-300 text-sm">
                      {formatPersonality(agent.personality)}
                    </span>
                  </div>
                </div>

                {/* Play Audio Button */}
                <div className="pt-2">
                  <button
                    onClick={isPlaying ? stopAudio : playAudio}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                      isPlaying
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-white text-black hover:bg-gray-200"
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
                    <div className="mt-3">
                      <audio
                        controls
                        autoPlay
                        src={audioUrl}
                        onEnded={stopAudio}
                        className="w-full max-w-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - AI Interaction */}
            <div className="flex flex-col items-center gap-4 mx-12 my-4">
              {/* AI Interaction Heading */}
              <h3 className="text-white font-semibold text-lg">Interaction with {agent.agentName}</h3>
              
              {/* Action Buttons and QR Code */}
              <div className="flex items-center gap-6 mx-10 my-4">
                {/* AI Talk Button - Icon Only */}
                <div className="">
                <button
                  onClick={handleVoiceChat}
                  className="w-20 h-20 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
                  title="AI Talk"
                >
                  <FiMic className="w-8 h-8" />
                </button>
                <h1 className="text-white text-center my-3">Talk</h1>
                </div>

                {/* AI Dial Button - Icon Only */}
                <div>
                <button
                  onClick={handleCall}
                  className="w-20 h-20 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center"
                  title="AI Dial"
                >
                  <FiPhoneCall className="w-8 h-8" />
                </button>
                <h1 className="text-white text-center my-3">Dial</h1>
                </div>
                {/* QR Code - Direct Display */}
                <div>
                <div className="flex flex-col items-center">
                  <WorkingQRCode
                    value={qrUrlValue}
                    size={80}
                    bgColor="#fff"
                    fgColor="#000"
                  />
                </div>
                <h1 className="text-white text-center my-3">Scan QR</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between gap-4">
            {/* First Message Section (moved from header) */}
            <div className="bg-gray-50 rounded-lg p-4 w-1/2">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5" />
                First Message
              </h3>
              <p className="text-gray-700 leading-relaxed italic">
                "{agent.firstMessage || "Not specified"}"
              </p>
            </div>

            {/* Description Section (moved from left) */}
            <div className="bg-gray-50 rounded-lg p-4 w-1/2">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5" />
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed italic">
                "{agent.description}"
              </p>
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
                  <FiMic className="w-4 h-4 text-gray-600 flex-shrink-0" />
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

                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <FiArrowUpRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Calling Number
                    </span>
                    <p className="text-sm font-medium text-gray-800">
                      {agent.callingNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <FiPhone className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Calling type
                    </span>
                    <p className="text-sm font-medium text-gray-800">
                      {agent.callingType}
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
                      Knowledge Base
                    </span>
                    <div className="text-sm font-small text-gray-800 max-h-40 overflow-y-auto pr-2">
                      <p className="whitespace-pre-line line-clamp-7 overflow-auto">
                        {agent.systemPrompt || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
                  <FiArrowLeft className="w-6 h-6" />
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
                      placeholder="example: Jay Shrama"
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
                      placeholder="(example 8873987243)"
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
                    </div>
                  </div>

          {/* Live Transcript */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">Live Transcript</div>
            <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
              {liveTranscriptLines.length === 0 ? (
                <div className="text-gray-500 text-sm">Waiting for conversation...</div>
              ) : (
                liveTranscriptLines.map((line, idx) => {
                  const isUser = line.includes('] User (');
                  const text = line.replace(/^\[[^\]]+\]\s(User|AI)\s\([^\)]+\):\s*/, '');
                  return (
                    <div key={idx} className={`flex mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${isUser ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <div>{text}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Chat Modal - Pure Voice-to-Voice Interface (from AgentDetails) */}
      {showVoiceChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    Voice Chat with {agent.agentName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <div className="flex items-center gap-1">
                      {wsConnectionStatus === 'connected' ? (
                        <>
                          <FiWifi className="w-3 h-3" />
                          <span className="text-green-200">Connected</span>
                        </>
                      ) : wsConnectionStatus === 'connecting' ? (
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
                        <span className="text-green-200">🎤 Active: {audioStats.chunksRecorded} chunks generated, {audioStats.chunksSent} sent</span>
                      ) : (
                        <span className="text-gray-300">🎤 Inactive</span>
                      )}
                      {isAITalking && (
                        <span className="text-blue-200 ml-2">🔊 Buffer: {audioBufferQueueRef.current.length} chunks</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeVoiceChat}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Voice Interface */}
            <div className="p-8 flex flex-col items-center justify-center min-h-[500px] space-y-8">
              {/* Connection Status */}
              <div className="text-center">
                <div className={`text-lg font-semibold mb-2 ${
                  wsConnectionStatus === 'connected' ? 'text-green-600' :
                  wsConnectionStatus === 'connecting' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {wsConnectionStatus === 'connected' ? 'Voice Chat Active' :
                   wsConnectionStatus === 'connecting' ? 'Connecting...' :
                   'Connection Failed'}
                </div>
                <div className="text-gray-600 text-sm">
                  {wsConnectionStatus === 'connected' 
                    ? 'Speak naturally - the AI will respond in real-time'
                    : wsConnectionStatus === 'connecting'
                    ? 'Please wait while we establish the connection'
                    : 'Check your connection and try again'
                  }
                </div>
                
                {/* Show reconnection status */}
                {isReconnecting && (
                  <div className="text-yellow-600 text-sm mt-2">
                    🔄 Reconnecting... (Attempt {reconnectAttempts}/{maxReconnectAttempts})
                  </div>
                )}
                
                {/* Show last disconnect reason */}
                {wsConnectionStatus === 'disconnected' && lastDisconnectReason && (
                  <div className="text-red-600 text-xs mt-1">
                    Last disconnect: {lastDisconnectReason}
                  </div>
                )}
              </div>

              {/* Large Microphone Visualization */}
              <div className="relative">
                {/* Main microphone circle */}
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isAudioStreaming
                    ? "bg-green-500 scale-110"
                    : wsConnectionStatus === 'connected'
                    ? "bg-blue-600"
                    : "bg-gray-400"
                }`}>
                  <FiMic className="w-12 h-12 text-white" />
                </div>

                {/* Microphone level indicator rings */}
                {isAudioStreaming && (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping"
                      style={{
                        animationDuration: '2s',
                        opacity: Math.min(0.8, micLevel / 100)
                      }}
                    />
                    <div 
                      className="absolute inset-[-8px] rounded-full border-2 border-green-200 animate-pulse"
                      style={{
                        animationDuration: '1.5s',
                        opacity: Math.min(0.6, micLevel / 100)
                      }}
                    />
                  </>
                )}

                {/* Simple connection status indicator */}
                {wsConnectionStatus === 'connected' && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}

                {/* AI Talking indicator */}
                {isAITalking && (
                  <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-3 bg-white rounded animate-pulse"></div>
                      <div className="w-1 h-3 bg-white rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1 h-3 bg-white rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
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
                {wsConnectionStatus === 'connected' && isAudioStreaming ? (
                  <div className="text-green-600 font-medium">
                    🎤 Listening... Speak to the AI
                  </div>
                ) : wsConnectionStatus === 'connected' && !isAudioStreaming ? (
                  <div className="text-blue-600 font-medium">
                    🔄 Starting audio stream...
                  </div>
                ) : wsConnectionStatus === 'connecting' ? (
                  <div className="text-yellow-600 font-medium">
                    🔄 Establishing voice connection...
                  </div>
                ) : (
                  <div className="text-red-600 font-medium">
                    ❌ Connection failed
                  </div>
                )}
                
                {/* AI Status Messages */}
                {aiStatus === 'listening' && (
                  <div className="text-blue-600 font-medium">
                    👂 AI is listening...
                  </div>
                )}
                
                {aiStatus === 'thinking' && (
                  <div className="text-purple-600 font-medium">
                    🤔 AI is thinking...
                  </div>
                )}
                
                {aiStatus === 'speaking' && (
                  <div className="text-green-600 font-medium">
                    🔊 AI is speaking...
                  </div>
                )}
                
                {aiStatus === 'idle' && isUserSpeaking && (
                  <div className="text-yellow-600 font-medium">
                    ⏳ Waiting for your question...
                  </div>
                )}

                {/* Fallback for old isAITalking state */}
                {isAITalking && aiStatus === 'idle' && (
                  <div className="text-blue-600">
                    🔊 AI is responding...
                  </div>
                )}
              </div>

              {/* Manual Controls for Debugging and Reconnection */}
              <div className="flex flex-wrap gap-4 text-sm justify-center">
                {wsConnectionStatus === 'disconnected' && !isReconnecting && (
                  <button
                    onClick={manualReconnect}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Reconnect
                  </button>
                )}
                
                {wsConnectionStatus === 'connected' && (
                  <>
                    {!isAudioStreaming ? (
                      <button
                        onClick={startContinuousAudioStreaming}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Start Audio Stream
                      </button>
                    ) : (
                      <button
                        onClick={stopContinuousAudioStreaming}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Stop Audio Stream
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                          audioContextRef.current.resume();
                          addDebugLog('Manually resumed audio context', 'info');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Resume Audio Context
                    </button>
                  </>
                )}
              </div>

              {/* Audio Stats */}
              {isAudioStreaming && (
                <div className="text-center text-xs text-gray-500 space-y-1">
                  <div>
                    <span className="font-medium">Audio Processing:</span> {audioStats.chunksRecorded} chunks generated | 
                    <span className="font-medium text-green-600"> {audioStats.chunksSent} sent</span> | 
                    {audioStats.bytesProcessed} bytes total
                  </div>
                  {audioStats.lastChunkTime && (
                    <div>Last Activity: {audioStats.lastChunkTime}</div>
                  )}
                  <div className="text-xs text-blue-600">
                    {audioStats.chunksRecorded > 0 && audioStats.chunksSent === 0 
                      ? "⚠️ Generating audio but WebSocket not ready"
                      : audioStats.chunksSent > 0 
                      ? "✅ Successfully streaming to server"
                      : "🔄 Initializing audio capture..."
                    }
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
                      | Reconnect attempts: {reconnectAttempts}/{maxReconnectAttempts}
                    </span>
                  )}
                </summary>
                <div className="px-3 pb-2 max-h-32 overflow-y-auto bg-gray-50 border-t border-gray-100">
                  <div className="font-mono text-xs space-y-1 pt-2">
                    {debugLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.type === 'error' ? 'text-red-600' :
                          log.type === 'success' ? 'text-green-600' :
                          log.type === 'warning' ? 'text-yellow-600' :
                          'text-gray-700'
                        }`}
                      >
                        <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                      </div>
                    ))}
                    {debugLogs.length === 0 && (
                      <div className="text-gray-400 italic">Debug logs will appear here...</div>
                    )}
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDetails;
