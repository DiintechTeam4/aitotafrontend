import React, { useState, useRef, useEffect } from "react";
import { FiMic, FiWifi, FiWifiOff, FiLoader, FiUser, FiArrowLeft } from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const getClientInfo = () => {
  try {
    const data = localStorage.getItem("clientData");
    if (data) return JSON.parse(data);
  } catch {}
  return null;
};

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;

const AgentMobileTalkUI = ({ agent, clientId, onClose }) => {
  // --- State ---
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [isStreaming, setIsStreaming] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [isAITalking, setIsAITalking] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioStats, setAudioStats] = useState({
    chunksRecorded: 0,
    chunksSent: 0,
    bytesProcessed: 0,
    lastChunkTime: null,
    streamingActive: false
  });
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectDelay, setReconnectDelay] = useState(INITIAL_RECONNECT_DELAY);
  const [lastDisconnectReason, setLastDisconnectReason] = useState("");
  
  // Speech detection states (like AgentDetails)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [userSpeechEnded, setUserSpeechEnded] = useState(false);
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle', 'listening', 'thinking', 'speaking'
  
  // WebSocket related states (like AgentDetails)
  const [streamSid, setStreamSid] = useState(null);
  
  // --- Refs ---
  const wsRef = useRef(null);
  const streamSidRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isStreamingRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  // Stream refs (like AgentDetails)
  const streamRef = useRef(null);
  const processorNodeRef = useRef(null);
  const microphoneRef = useRef(null);
  // Playback refs
  const audioPlaybackContextRef = useRef(null);
  const audioBufferQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const playbackStartTimeRef = useRef(0);
  const nextPlayTimeRef = useRef(0);
  // Speech detection refs (like AgentDetails)
  const silenceTimerRef = useRef(null);
  const silenceStartTimeRef = useRef(null);

  // --- Helpers ---
  const addDebugLog = (msg, type = "info") => {
    setDebugLogs((prev) => [...prev.slice(-19), { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  // --- WebSocket Logic (robust, like AgentDetails) ---
  const connectWebSocket = (isReconnect = false) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      addDebugLog("WebSocket already connected", "info");
      return;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (isReconnect) {
      setIsReconnecting(true);
      addDebugLog(`Reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`, "info");
    } else {
      setReconnectAttempts(0);
      setReconnectDelay(INITIAL_RECONNECT_DELAY);
      setIsReconnecting(false);
    }
    setWsStatus("connecting");
    setIsConnecting(true);
    addDebugLog("Attempting WebSocket connection...", "info");
    const wsUrl = `wss://test.aitota.com/ws`;
    addDebugLog(`Connecting to: ${wsUrl}`, "info");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    // Connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        addDebugLog("WebSocket connection timeout", "error");
        ws.close();
        handleConnectionFailure("Connection timeout");
      }
    }, 10000);
    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      addDebugLog("WebSocket connected successfully", "success");
      setWsStatus("connected");
      setIsConnecting(false);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      setReconnectDelay(INITIAL_RECONNECT_DELAY);
      setLastDisconnectReason("");
      // Generate streamSid
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      streamSidRef.current = streamId;
      setStreamSid(streamId); // Set the state variable
      addDebugLog(`Generated streamSid: ${streamId}`, "success");
      
      // Build start message as in AgentDetails
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
              CallDirection: "InDial",
            })
          ),
        },
      };
      addDebugLog(`Sending start message: ${JSON.stringify(startMessage)}`, "info");
      ws.send(JSON.stringify(startMessage));
      
      // Start audio streaming after connection and start message
      setTimeout(() => {
        addDebugLog("Starting audio streaming after WebSocket connection...", "info");
        startAudioStreaming();
      }, 1000);
      
      // Retry audio streaming start if it fails initially
      setTimeout(() => {
        if (!isStreamingRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          addDebugLog('Retrying audio streaming start...', 'info');
          startAudioStreaming();
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
        addDebugLog(`Received WebSocket message: ${data.event}`, "info");
        handleWebSocketMessage(data);
      } catch (error) {
        addDebugLog(`Error parsing WebSocket message: ${error.message}`, "error");
      }
    };
    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      addDebugLog(`WebSocket error: ${error}`, "error");
      setWsStatus("disconnected");
      setIsConnecting(false);
      setIsReconnecting(false);
    };
    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      const reason = event?.reason || `Code: ${event?.code}`;
      addDebugLog(`WebSocket disconnected. Code: ${event?.code}, Reason: ${event?.reason}`, "warning");
      setWsStatus("disconnected");
      setIsStreaming(false);
      setIsConnecting(false);
      setStreamSid(null);
      streamSidRef.current = null;
      setLastDisconnectReason(reason);
      stopAudioStreaming();
      if (event?.code !== 1000 && event?.code !== 1001) {
        handleConnectionFailure(reason);
      }
    };
  };

  // Handle WebSocket messages (like AgentDetails)
  const handleWebSocketMessage = (data) => {
    switch (data.event) {
      case 'connected':
        addDebugLog('WebSocket session connected', 'success');
        break;
        
      case 'start':
        addDebugLog(`Session started with streamSid: ${data.streamSid}`, 'success');
        setStreamSid(data.streamSid);
        streamSidRef.current = data.streamSid;
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
        
      case 'error':
        addDebugLog(`Server error: ${data.message || 'Unknown error'}`, 'error');
        break;
        
      default:
        addDebugLog(`Unknown WebSocket event: ${data.event}`, 'warning');
    }
  };

  const handleConnectionFailure = (reason) => {
    setLastDisconnectReason(reason);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts), 30000);
      addDebugLog(`Connection failed: ${reason}. Reconnecting in ${delay / 1000}s...`, "warning");
      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempts((prev) => prev + 1);
        connectWebSocket(true);
      }, delay);
      setReconnectDelay(delay);
    } else {
      addDebugLog(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Please reconnect manually.`, "error");
      setIsReconnecting(false);
    }
  };

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsReconnecting(false);
    setReconnectAttempts(0);
    setReconnectDelay(INITIAL_RECONNECT_DELAY);
    if (wsRef.current) {
      addDebugLog("Disconnecting WebSocket...", "info");
      wsRef.current.send(
        JSON.stringify({ event: "stop", streamSid: streamSidRef.current })
      );
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }
    setWsStatus("disconnected");
    setIsStreaming(false);
    setStreamSid(null);
    streamSidRef.current = null;
    stopAudioStreaming();
    addDebugLog("WebSocket manually disconnected", "info");
  };

  // Manual reconnect function
  const manualReconnect = () => {
    addDebugLog('Manual reconnection initiated', 'info');
    
    // Reset reconnection state
    setReconnectAttempts(0);
    setReconnectDelay(INITIAL_RECONNECT_DELAY);
    setIsReconnecting(false);
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Disconnect existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Start new connection
    connectWebSocket(false);
  };

  // --- Audio Streaming (with AudioWorklet support) ---
  const startAudioStreaming = async () => {
    if (isStreamingRef.current) {
      addDebugLog('Audio streaming already active', 'warning');
      return;
    }

    // Check if WebSocket is ready before starting audio streaming
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addDebugLog('WebSocket not ready, cannot start audio streaming', 'error');
      return;
    }

    if (!streamSidRef.current) {
      addDebugLog('No streamSid available, cannot start audio streaming', 'error');
      return;
    }

    addDebugLog('Starting continuous audio streaming...', 'info');

    try {
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
      
      // Try AudioWorklet
      let workletLoaded = false;
      try {
        if (audioContextRef.current.audioWorklet) {
          await audioContextRef.current.audioWorklet.addModule("/audio-processor.js");
          const workletNode = new window.AudioWorkletNode(audioContextRef.current, "audio-processor");
          workletNode.port.onmessage = (event) => {
            if (event.data.type === "audioData") {
              processAudioData(event.data.data);
            }
          };
          source.connect(workletNode);
          workletNode.connect(audioContextRef.current.destination);
          workletNode.port.postMessage({ type: "activate" });
          workletLoaded = true;
          addDebugLog("AudioWorkletNode loaded for chunking", "success");
        }
      } catch (e) {
        addDebugLog("AudioWorklet not available, falling back to ScriptProcessorNode", "warning");
      }
      
      if (!workletLoaded) {
        // Fallback to ScriptProcessorNode (like AgentDetails)
        const bufferSize = 4096; // Larger buffer for more stable processing
        const scriptProcessor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
        
        let sampleBuffer = [];
        const targetSampleRate = 8000; // Target sample rate for server
        const downsampleRatio = audioContextRef.current.sampleRate / targetSampleRate;
        let downsampleCounter = 0;
        
        scriptProcessor.onaudioprocess = (event) => {
          if (!isStreamingRef.current) {
            return;
          }
          
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);
          
          // Debug: Log when audio processing starts
          if (inputData.length > 0) {
            addDebugLog(`Processing ${inputData.length} audio samples`, 'info');
          }
          
          // Downsample from browser's native sample rate to 8kHz
          for (let i = 0; i < inputData.length; i++) {
            downsampleCounter++;
            if (downsampleCounter >= downsampleRatio) {
              sampleBuffer.push(inputData[i]);
              downsampleCounter = 0;
              
              // When we have 80 samples (10ms at 8kHz), process them
              if (sampleBuffer.length >= 80) {
                const chunk = new Float32Array(sampleBuffer.splice(0, 80));
                addDebugLog(`Sending audio chunk to processAudioData`, 'info');
                processAudioData(chunk);
              }
            }
          }
        };
        
        source.connect(scriptProcessor);
        scriptProcessor.connect(audioContextRef.current.destination);
        
        processorNodeRef.current = scriptProcessor;
        microphoneRef.current = { stream, scriptProcessor };
        
        addDebugLog('ScriptProcessor connected and ready for audio processing', 'success');
      }
      
      isStreamingRef.current = true;
      setIsStreaming(true);
      
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
      isStreamingRef.current = false;
      setIsStreaming(false);
    }
  };

  // --- Chunk Sending ---
  const processAudioData = (audioData) => {
    // Always process audio data, regardless of WebSocket state initially
    try {
      addDebugLog(`processAudioData called with ${audioData.length} samples`, 'info');
      
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
      
      addDebugLog(`Audio converted to base64: ${base64Audio.length} chars`, 'info');
      
      // Get current WebSocket connection and streamSid from refs to avoid stale closures
      const currentWs = wsRef.current;
      const currentStreamSid = streamSidRef.current;
      
      addDebugLog(`WebSocket state: ${currentWs ? currentWs.readyState : 'null'}, streamSid: ${currentStreamSid}`, 'info');
      
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
        addDebugLog(`Audio chunk sent to WebSocket successfully`, 'success');
        
        // Log every 25th chunk to show activity (using the updated stats)
        setAudioStats(prev => {
          if (prev.chunksSent % 25 === 0) {
            addDebugLog(`Sent audio chunk #${prev.chunksSent} (160 bytes, ${base64Audio.length} chars base64)`, 'info');
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

  // Update mic level with speech detection (like AgentDetails)
  const updateMicLevel = () => {
    if (!isStreamingRef.current || !analyserRef.current) return;

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

    // Speech detection logic (like AgentDetails)
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

  // --- Stop Audio Streaming ---
  const stopAudioStreaming = () => {
    addDebugLog('Stopping continuous audio streaming...', 'info');
    
    isStreamingRef.current = false;
    setIsStreaming(false);
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

  // --- Audio Playback (like AgentDetails) ---
  const playAudioChunk = async (base64Audio) => {
    try {
      addDebugLog(`Received audio chunk: ${base64Audio.length} chars`, 'info');
      if (!audioPlaybackContextRef.current) {
        audioPlaybackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 8000 });
        addDebugLog('Audio playback context created', 'info');
      }
      const audioContext = audioPlaybackContextRef.current;
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
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }
      // Add to buffer queue
      audioBufferQueueRef.current.push({ data: float32Array, timestamp: Date.now() });
      // Limit buffer size
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

  const startContinuousPlayback = async () => {
    if (isPlayingRef.current) return;
    try {
      isPlayingRef.current = true;
      setIsAITalking(true);
      setAiStatus('speaking');
      const audioContext = audioPlaybackContextRef.current;
      if (!audioContext) return;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const startDelay = 0.1;
      playbackStartTimeRef.current = audioContext.currentTime + startDelay;
      nextPlayTimeRef.current = audioContext.currentTime + startDelay;
      addDebugLog(`Starting continuous audio playback with ${startDelay}s delay`, 'success');
      setTimeout(() => {
        scheduleNextChunk();
      }, startDelay * 150);
    } catch (error) {
      addDebugLog(`Error starting continuous playback: ${error.message}`, 'error');
      isPlayingRef.current = false;
      setIsAITalking(false);
    }
  };

  const scheduleNextChunk = () => {
    if (!isPlayingRef.current || !audioPlaybackContextRef.current) return;
    const audioContext = audioPlaybackContextRef.current;
    const queue = audioBufferQueueRef.current;
    if (queue.length === 0) {
      isPlayingRef.current = false;
      setIsAITalking(false);
      setAiStatus('idle');
      setUserSpeechEnded(false);
      addDebugLog('Audio playback queue empty, stopping', 'info');
      return;
    }
    const chunksToProcess = Math.min(queue.length, 5);
    let totalDuration = 0;
    for (let i = 0; i < chunksToProcess; i++) {
      const chunk = queue.shift();
      const float32Array = chunk.data;
      const buffer = audioContext.createBuffer(1, float32Array.length, 8000);
      buffer.getChannelData(0).set(float32Array);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      const chunkDuration = float32Array.length / 8000;
      source.start(nextPlayTimeRef.current + totalDuration);
      totalDuration += chunkDuration;
    }
    nextPlayTimeRef.current += totalDuration;
    const timeUntilNext = (nextPlayTimeRef.current - audioContext.currentTime) * 1000;
    setTimeout(() => {
      scheduleNextChunk();
    }, Math.max(0, timeUntilNext - 20));
  };

  // Stop continuous audio playback
  const stopContinuousPlayback = () => {
    isPlayingRef.current = false;
    setIsAITalking(false);
    audioBufferQueueRef.current = [];
    nextPlayTimeRef.current = 0;
    addDebugLog('Continuous audio playback stopped', 'info');
  };

  // --- Cleanup on unmount ---
  useEffect(() => () => { 
    disconnectWebSocket(); 
    stopAudioStreaming();
    // Cleanup playback context
    if (audioPlaybackContextRef.current && audioPlaybackContextRef.current.state !== 'closed') {
      audioPlaybackContextRef.current.close();
      audioPlaybackContextRef.current = null;
    }
    isPlayingRef.current = false;
    audioBufferQueueRef.current = [];
    
    // Clear speech detection timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // --- UI ---
  const client = getClientInfo();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Top: Client Details */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white shadow-md">
        <button onClick={onClose} className="p-2 rounded-full bg-blue-500 hover:bg-blue-700"><FiArrowLeft size={22} /></button>
        <div className="flex-1">
          <div className="font-bold text-lg">{client?.name || "Client"}</div>
          <div className="text-xs opacity-80">{client?.email || "No email"}</div>
        </div>
        <FiUser size={28} className="opacity-80" />
      </div>
      {/* Middle: Agent Details */}
      <div className="flex flex-col items-center py-4">
        <div className="rounded-full bg-gray-200 w-20 h-20 flex items-center justify-center mb-2">
          <FiUser size={40} className="text-blue-600" />
        </div>
        <div className="font-semibold text-xl text-blue-900">{agent.agentName}</div>
        <div className="text-xs text-gray-500">{agent.category || "Agent"}</div>
        <div className="text-xs text-gray-500">{agent.language || "English"}</div>
      </div>
      {/* Main: Mic Button */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          className={`rounded-full shadow-lg flex items-center justify-center transition-all duration-200
            ${wsStatus === "connected" ? "bg-green-500" : wsStatus === "connecting" ? "bg-yellow-400" : "bg-blue-500"}
            ${isStreaming ? "scale-110" : ""}
          `}
          style={{ width: 120, height: 120 }}
          onClick={() => {
            if (wsStatus === "connected") disconnectWebSocket();
            else connectWebSocket();
          }}
          disabled={isConnecting}
        >
          {wsStatus === "connecting" ? (
            <FiLoader size={60} className="text-white animate-spin" />
          ) : wsStatus === "connected" ? (
            <FiMic size={60} className="text-white" />
          ) : (
            <FiMic size={60} className="text-white opacity-80" />
          )}
        </button>
        <div className="mt-4 text-center">
          {wsStatus === "connected" && isStreaming && (
            <div className="text-green-700 font-semibold flex items-center justify-center gap-2">
              <FiWifi /> Voice Chat Active
            </div>
          )}
          {wsStatus === "connecting" && (
            <div className="text-yellow-700 font-semibold flex items-center justify-center gap-2">
              <FiLoader className="animate-spin" /> Connecting...
            </div>
          )}
          {wsStatus === "disconnected" && (
            <div className="text-gray-500 font-semibold flex items-center justify-center gap-2">
              <FiWifiOff /> Disconnected
            </div>
          )}
          {isReconnecting && (
            <div className="text-yellow-600 text-xs mt-2">
              🔄 Reconnecting... (Attempt {reconnectAttempts}/{MAX_RECONNECT_ATTEMPTS})
            </div>
          )}
          {wsStatus === 'disconnected' && lastDisconnectReason && (
            <div className="text-red-600 text-xs mt-1">
              Last disconnect: {lastDisconnectReason}
            </div>
          )}
        </div>
        {/* Mic Level Bar */}
        {isStreaming && (
          <div className="w-32 h-3 bg-gray-200 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-100 ease-out rounded-full"
              style={{ width: `${Math.min(100, micLevel)}%` }}
            />
          </div>
        )}
        {/* AI Talking Indicator */}
        {isAITalking && (
          <div className="mt-4 text-blue-600 font-medium flex items-center gap-2">
            <FiMic className="animate-pulse" /> AI Speaking...
          </div>
        )}
        
        {/* AI Status Messages (like AgentDetails) */}
        {aiStatus === 'listening' && (
          <div className="mt-2 text-blue-600 font-medium">
            👂 AI is listening...
          </div>
        )}
        
        {aiStatus === 'thinking' && (
          <div className="mt-2 text-purple-600 font-medium">
            🤔 AI is thinking...
          </div>
        )}
        
        {aiStatus === 'speaking' && (
          <div className="mt-2 text-green-600 font-medium">
            🔊 AI is speaking...
          </div>
        )}

        {/* Manual Controls for Debugging and Reconnection */}
        <div className="flex flex-wrap gap-2 text-sm justify-center mt-4">
          {wsStatus === 'disconnected' && !isReconnecting && (
            <button
              onClick={manualReconnect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-xs"
            >
              Reconnect
            </button>
          )}
          
          {wsStatus === 'connected' && (
            <>
              {!isStreaming ? (
                <button
                  onClick={startAudioStreaming}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                >
                  Start Audio
                </button>
              ) : (
                <button
                  onClick={stopAudioStreaming}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs"
                >
                  Stop Audio
                </button>
              )}
              <button
                onClick={() => {
                  if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume();
                    addDebugLog('Manually resumed audio context', 'info');
                  }
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
              >
                Resume Audio
              </button>
            </>
          )}
        </div>
      </div>
      {/* Audio Stats & Debug (collapsible) */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Audio: {audioStats.chunksRecorded} chunks | {audioStats.chunksSent} sent | {audioStats.bytesProcessed} bytes
            {streamSid && <span className="ml-2 text-blue-600">| Stream: {streamSid.substring(0, 8)}...</span>}
          </div>
          <button className="text-xs text-blue-600 underline" onClick={() => setShowDebug((v) => !v)}>
            {showDebug ? "Hide" : "Show"} Debug
          </button>
        </div>
        {showDebug && (
          <div className="mt-2 bg-gray-50 rounded p-2 max-h-32 overflow-y-auto text-xs font-mono">
            {debugLogs.map((log, i) => (
              <div key={i} className={
                log.type === "error" ? "text-red-600" :
                log.type === "success" ? "text-green-600" :
                log.type === "warning" ? "text-yellow-600" : "text-gray-700"
              }>
                <span className="text-gray-400">[{log.ts}]</span> {log.msg}
              </div>
            ))}
            {debugLogs.length === 0 && <div className="text-gray-400 italic">No debug logs yet.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentMobileTalkUI;
