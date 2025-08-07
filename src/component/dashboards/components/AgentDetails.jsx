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
  const [showCallModal, setShowCallModal] = useState(false);
  const [showVoiceChatModal, setShowVoiceChatModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [callStage, setCallStage] = useState("input");
  const [voiceChatMessages, setVoiceChatMessages] = useState([]);
  const [micLevel, setMicLevel] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [callMessages, setCallMessages] = useState([]);
  const [isCallRecording, setIsCallRecording] = useState(false);
  const [callMicLevel, setCallMicLevel] = useState(0);

  // WebSocket related states
  const [wsConnection, setWsConnection] = useState(null);
  const [wsConnectionStatus, setWsConnectionStatus] = useState('disconnected');
  const [isAITalking, setIsAITalking] = useState(false);
  const [streamSid, setStreamSid] = useState(null);
  const [isAudioStreaming, setIsAudioStreaming] = useState(false);

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
  const audioWorkletNodeRef = useRef(null);
  const streamRef = useRef(null);
  const isStreamingActiveRef = useRef(false);

  const messagesEndRef = useRef(null);
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

  // WebSocket connection management
  const connectToWebSocket = () => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      addDebugLog('WebSocket already connected', 'info');
      return;
    }

    setWsConnectionStatus('connecting');
    addDebugLog('Attempting WebSocket connection...', 'info');
    
    const wsUrl = `wss://test.aitota.com/ws?clientId=${clientId}&agentId=${agent._id}`;
    addDebugLog(`Connecting to: ${wsUrl}`, 'info');
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      addDebugLog('WebSocket connected successfully', 'success');
      setWsConnectionStatus('connected');
      setWsConnection(ws);
      
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setStreamSid(streamId);
      
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
            clientId: clientId
          }))
        }
      };
      
      addDebugLog(`Sending start message: ${JSON.stringify(startMessage)}`, 'info');
      ws.send(JSON.stringify(startMessage));
      
      // Auto-start audio streaming once WebSocket is connected
      setTimeout(() => {
        startContinuousAudioStreaming();
      }, 1000);
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
      addDebugLog(`WebSocket error: ${error}`, 'error');
      setWsConnectionStatus('disconnected');
    };
    
    ws.onclose = (event) => {
      addDebugLog(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`, 'warning');
      setWsConnectionStatus('disconnected');
      setWsConnection(null);
      setStreamSid(null);
      stopContinuousAudioStreaming();
    };
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
          playAudioChunk(data.media.payload);
        }
        break;
        
      case 'stop':
        addDebugLog('Session stopped by server', 'info');
        break;
        
      default:
        addDebugLog(`Unknown WebSocket event: ${data.event}`, 'warning');
    }
  };

  const disconnectWebSocket = () => {
    if (wsConnection) {
      addDebugLog('Disconnecting WebSocket...', 'info');
      wsConnection.send(JSON.stringify({
        event: 'stop',
        streamSid: streamSid
      }));
      
      wsConnection.close();
      setWsConnection(null);
      setWsConnectionStatus('disconnected');
      setStreamSid(null);
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

      addDebugLog('Starting continuous audio streaming...', 'info');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 8000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        } 
      });

      streamRef.current = stream;
      addDebugLog('Microphone access granted for continuous streaming', 'success');

      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 8000
      });

      addDebugLog(`Audio context created with sample rate: ${audioContextRef.current.sampleRate}`, 'info');
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create analyzer for visual feedback
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Try to use AudioWorkletNode (modern approach)
      try {
        await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
        addDebugLog('AudioWorklet module loaded successfully', 'success');
        
        audioWorkletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
        
        audioWorkletNodeRef.current.port.onmessage = (event) => {
          if (event.data.type === 'audioData' && isStreamingActiveRef.current) {
            processAudioData(event.data.data);
          }
        };
        
        // Activate the processor
        audioWorkletNodeRef.current.port.postMessage({ type: 'activate' });
        
        source.connect(audioWorkletNodeRef.current);
        audioWorkletNodeRef.current.connect(audioContextRef.current.destination);
        
        addDebugLog('AudioWorkletNode setup complete', 'success');
        
      } catch (workletError) {
        addDebugLog(`AudioWorklet failed, falling back to ScriptProcessor: ${workletError.message}`, 'warning');
        
        // Fallback to ScriptProcessorNode with proper chunk size
        const scriptProcessor = audioContextRef.current.createScriptProcessor(1024, 1, 1);
        let sampleBuffer = [];
        
        scriptProcessor.onaudioprocess = (event) => {
          if (!isStreamingActiveRef.current) return;
          
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);
          
          // Accumulate samples
          for (let i = 0; i < inputData.length; i++) {
            sampleBuffer.push(inputData[i]);
            
            // When we have 80 samples (160 bytes), process them
            if (sampleBuffer.length >= 80) {
              const chunk = new Float32Array(sampleBuffer.splice(0, 80));
              processAudioData(chunk);
            }
          }
        };
        
        source.connect(scriptProcessor);
        scriptProcessor.connect(audioContextRef.current.destination);
        
        microphoneRef.current = { stream, scriptProcessor };
        addDebugLog('ScriptProcessor fallback setup complete', 'success');
      }

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

    // Cleanup audio components
    if (microphoneRef.current && microphoneRef.current.scriptProcessor) {
      microphoneRef.current.scriptProcessor.disconnect();
      addDebugLog('ScriptProcessor disconnected', 'info');
    }

    // Disconnect AudioWorkletNode
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.port.postMessage({ type: 'deactivate' });
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
      addDebugLog('AudioWorkletNode disconnected', 'info');
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
    if (!isStreamingActiveRef.current || !wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Convert float32 to int16 (80 samples = 160 bytes)
      const int16Array = new Int16Array(80);
      for (let i = 0; i < 80; i++) {
        int16Array[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
      }
      
      // Convert to base64 using browser APIs
      const bytes = new Uint8Array(int16Array.buffer); // This will be exactly 160 bytes
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binaryString);
      
      // Update stats
      setAudioStats(prev => ({
        chunksRecorded: prev.chunksRecorded + 1,
        chunksSent: prev.chunksSent + 1,
        bytesProcessed: prev.bytesProcessed + 160, // Always 160 bytes
        lastChunkTime: new Date().toLocaleTimeString(),
        streamingActive: true
      }));
      
      // Send via WebSocket
      const mediaMessage = {
        event: 'media',
        streamSid: streamSid,
        media: {
          payload: base64Audio
        }
      };
      
      wsConnection.send(JSON.stringify(mediaMessage));
      
      // Log every 50th chunk to avoid spam but show activity
      if (audioStats.chunksSent % 50 === 0) {
        addDebugLog(`Sent 160-byte audio chunk #${audioStats.chunksSent + 1}, base64 size: ${base64Audio.length} chars`, 'info');
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

    animationFrameRef.current = requestAnimationFrame(updateMicLevel);
  };

  // Audio playback for AI responses
  const playAudioChunk = async (base64Audio) => {
    try {
      addDebugLog(`Playing audio chunk: ${base64Audio.length} chars`, 'info');
      
      if (!audioPlaybackContextRef.current) {
        audioPlaybackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 8000
        });
        addDebugLog('Audio playback context created', 'info');
      }

      const audioContext = audioPlaybackContextRef.current;
      
      // Convert base64 to binary data using browser APIs
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert bytes to Int16Array (assuming the audio data is 16-bit PCM)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      
      // Convert int16 to float32
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }
      
      // Create audio buffer
      const buffer = audioContext.createBuffer(1, float32Array.length, 8000);
      buffer.getChannelData(0).set(float32Array);
      
      // Play audio
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setIsAITalking(false);
        addDebugLog('Audio playback ended', 'info');
      };
      
      setIsAITalking(true);
      source.start();
      addDebugLog('Audio playback started', 'success');
      
    } catch (error) {
      addDebugLog(`Error playing audio chunk: ${error.message}`, 'error');
      setIsAITalking(false);
    }
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
    setVoiceChatMessages([
      {
        id: 1,
        type: "ai",
        message: agent.firstMessage || "Hello! I'm here to help you. How can I assist you today?",
        timestamp: new Date(),
      },
    ]);
    
    // Clear debug logs
    setDebugLogs([]);
    addDebugLog('Voice chat modal opened', 'info');
    
    // Connect to WebSocket when opening voice chat
    connectToWebSocket();
  };

  const closeVoiceChat = () => {
    addDebugLog('Closing voice chat...', 'info');
    setShowVoiceChatModal(false);
    setVoiceChatMessages([]);
    setMicLevel(0);
    setIsAITalking(false);

    // Stop continuous streaming
    stopContinuousAudioStreaming();
    
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

  const makeAIDialCall = async (targetPhoneNumber, agentCallerId, agentApiKey, clientUuid) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        throw new Error("Client token not found. Please log in.");
      }

      const callPayload = {
        transaction_id: "CTI_BOT_DIAL",
        phone_num: targetPhoneNumber.replace(/[^\d]/g, ""),
        uniqueid: `aidial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        callerid: agentCallerId,
        uuid: clientUuid,
        custom_param: {
          agentId: agent._id,
          agentName: agent.agentName,
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

      const result = await makeAIDialCall(
        phoneNumber,
        agent.callerId,
        agent.X_API_KEY,
        clientId
      );

      if (result.success) {
        setCallStage("connected");
        setIsCallConnected(true);
      } else {
        setCallStage("input");
        setIsCallConnected(false);
        alert(`Failed to initiate call: ${result.error}`);
        console.error("AI Dial initiation failed:", result.error);
      }
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
    setIsCallRecording(false);
    setCallMicLevel(0);
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voiceChatMessages, callMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop continuous streaming
      stopContinuousAudioStreaming();

      // Cleanup call timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }

      // Disconnect WebSocket
      disconnectWebSocket();
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Chat Modal */}
      {showVoiceChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    AI Talk ({agent.agentName})
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
                        <span className="text-green-200">🎤 Streaming: {audioStats.chunksRecorded} chunks (160 bytes each)</span>
                      ) : (
                        <span className="text-gray-300">🎤 Not streaming</span>
                      )}
                    </div>
                  </div>
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
            <div className="p-6 grid grid-cols-2 gap-6 h-[70vh]">
              {/* Left Side - Chat Messages */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Conversation</h4>
                <div className="h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-3">
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
                  
                  {/* AI Talking Indicator */}
                  {isAITalking && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm">AI is speaking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Audio Streaming Indicator */}
                <div className="flex items-center justify-center py-4">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isAudioStreaming
                        ? "bg-green-500 scale-110"
                        : wsConnectionStatus === 'connected'
                        ? "bg-blue-600"
                        : "bg-gray-400"
                    }`}>
                      <FiMic className="w-6 h-6 text-white" />
                    </div>

                    {/* Mic Level Indicator */}
                    {isAudioStreaming && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
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
                    {wsConnectionStatus !== 'connected'
                      ? "Connecting to voice service..."
                      : isAudioStreaming
                      ? "🎤 Continuously streaming 160-byte audio chunks"
                      : "Waiting to start audio streaming..."}
                  </p>
                  {audioStats.lastChunkTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last chunk: {audioStats.lastChunkTime} | Total: {audioStats.bytesProcessed} bytes
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side - Debug Logs */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Debug Logs</h4>
                <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 font-mono text-xs">
                  {debugLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`mb-1 ${
                        log.type === 'error' ? 'text-red-600' :
                        log.type === 'success' ? 'text-green-600' :
                        log.type === 'warning' ? 'text-yellow-600' :
                        'text-gray-700'
                      }`}
                    >
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))}
                  {debugLogs.length === 0 && (
                    <div className="text-gray-500 italic">Debug logs will appear here...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDetails;
