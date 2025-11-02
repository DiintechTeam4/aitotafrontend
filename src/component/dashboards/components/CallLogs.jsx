"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  FiCalendar,
  FiClock,
  FiPhone,
  FiUser,
  FiFilter,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiPlay,
  FiPause,
  FiFileText,
  FiDownload,
  FiX,
} from "react-icons/fi";
import { FaPlay, FaPause } from "react-icons/fa";
import { API_BASE_URL } from "../../../config";

const CallLogs = ({ agentId, clientId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("last7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [agent, setAgent] = useState(null);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [showTranscriptPopup, setShowTranscriptPopup] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const rafIdRef = useRef(null);

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";

    // Handle decimal seconds by rounding to nearest whole number
    const roundedSeconds = Math.round(seconds);

    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const total = Math.round(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const API_BASE = `${API_BASE_URL}/client`;
  
  const audioUrl = useMemo(() => {
    if (!selectedCall?.audioUrl) return undefined;
    const raw = selectedCall.audioUrl;
    
    // Add token to query parameter for audio element compatibility
    const token = sessionStorage.getItem("clienttoken");
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    
    // If URL already includes /call-audio, add token parameter if not present
    if (raw && /\/call-audio(\?|$)/.test(String(raw))) {
      if (token && !raw.includes('token=')) {
        // Add token to existing query string
        const separator = raw.includes('?') ? '&' : '?';
        return `${raw}${separator}token=${encodeURIComponent(token)}`;
      }
      return raw;
    }
    
    // If raw URL is S3 URL or empty, convert to proxy URL
    if ((raw && /https?:\/\/[^\s]*s3[^\s]*amazonaws\.com\//i.test(String(raw)) || (!raw || String(raw).trim() === '')) && selectedCall._id && agentId) {
      return `${API_BASE}/agents/${agentId}/call-audio?callLogId=${encodeURIComponent(selectedCall._id)}${tokenParam}`;
    }
    
    // Fallback: return raw URL
    return raw;
  }, [selectedCall?._id, selectedCall?.audioUrl, agentId]);

  const handlePlayPause = () => {
    if (!audioUrl || !audioRef.current || !audioAvailable) {
      return;
    }
    const audio = audioRef.current;
    if (isPlaying) {
      try {
        audio.pause();
      } catch (err) {
        setIsPlaying(false);
      }
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {})
          .catch((error) => {
            setIsPlaying(false);
          });
      }
    }
  };

  const handleDownloadAudio = async () => {
    if (!audioUrl || !selectedCall) return;
    try {
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(audioUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to download audio");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safePhone = String(selectedCall?.mobile || "").replace(/\D/g, "") || "call";
      const dateStr = selectedCall?.time 
        ? new Date(selectedCall.time).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      a.download = `call_recording_${safePhone}_${dateStr}.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download audio:", error);
      alert("Failed to download audio recording");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTimeOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTranscriptDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLeadStatusColor = (status) => {
    const statusColors = {
      vvi: "bg-green-100 text-green-800",
      very_interested: "bg-green-100 text-green-800",
      maybe: "bg-yellow-100 text-yellow-800",
      medium: "bg-yellow-100 text-yellow-800",
      enrolled: "bg-blue-100 text-blue-800",
      junk_lead: "bg-red-100 text-red-800",
      not_required: "bg-gray-100 text-gray-800",
      enrolled_other: "bg-purple-100 text-purple-800",
      decline: "bg-red-100 text-red-800",
      not_eligible: "bg-orange-100 text-orange-800",
      wrong_number: "bg-gray-100 text-gray-800",
      hot_followup: "bg-pink-100 text-pink-800",
      cold_followup: "bg-indigo-100 text-indigo-800",
      schedule: "bg-teal-100 text-teal-800",
      not_connected: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getLeadStatusLabel = (status) => {
    const statusLabels = {
      vvi: "Very Very Interested",
      very_interested: "Very Interested",
      maybe: "Maybe",
      medium: "Medium",
      enrolled: "Enrolled",
      junk_lead: "Junk Lead",
      not_required: "Not Required",
      enrolled_other: "Enrolled Other",
      decline: "Decline",
      not_eligible: "Not Eligible",
      wrong_number: "Wrong Number",
      hot_followup: "Hot Followup",
      cold_followup: "Cold Followup",
      schedule: "Schedule",
      not_connected: "Not Connected",
    };
    return statusLabels[status] || status;
  };

  const fetchCallLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        throw new Error("Client token not found");
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      if (filter && filter !== "all") {
        params.append("filter", filter);
      } else if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agentId}/call-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch call logs");
      }

      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setStatistics(data.data.statistics);
        setAgent(data.data.agent);
        setTotalPages(data.data.pagination.totalPages);
        setTotalLogs(data.data.pagination.totalLogs);
      } else {
        throw new Error(data.error || "Failed to fetch call logs");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching call logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId && clientId) {
      fetchCallLogs();
    }
  }, [agentId, clientId, filter, startDate, endDate, currentPage]);

  // Reset audio state when selected call changes
  useEffect(() => {
    setIsPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setAudioAvailable(true);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }
  }, [selectedCall?._id]);

  // Update audio timeline during playback
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    const updateTime = () => {
      if (audio && !audio.paused) {
        const currentTime = audio.currentTime;
        setAudioCurrentTime(currentTime);
        rafIdRef.current = requestAnimationFrame(updateTime);
      }
    };
    
    const handleLoadedMetadata = () => {
      if (audio) {
        const duration = audio.duration || 0;
        setAudioDuration(duration);
        setAudioCurrentTime(audio.currentTime || 0);
      }
    };
    
    const handleDurationChange = () => {
      if (audio) {
        const duration = audio.duration || 0;
        setAudioDuration(duration);
      }
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(updateTime);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (audio) {
        setAudioCurrentTime(audio.currentTime);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setAudioCurrentTime(0);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
    
    const handleError = () => {
      setAudioAvailable(false);
      setIsPlaying(false);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
    };
    
    const handleLoadedData = () => {
      setAudioAvailable(true);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadeddata', handleLoadedData);
    
    if (!audio.paused) {
      rafIdRef.current = requestAnimationFrame(updateTime);
    }
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [audioUrl, selectedCall?._id]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleDateRangeChange = () => {
    setFilter("all");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openTranscriptPopup = (log) => {
    setSelectedTranscript(log);
    setSelectedCall(log);
    setShowTranscriptPopup(true);
  };

  const closeTranscriptPopup = () => {
    setShowTranscriptPopup(false);
    setSelectedTranscript(null);
    setSelectedCall(null);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }
  };

  // ===== Lightweight PDF helpers (inline, similar to AgentList/CampaignDetails) =====
  const ensureJsPDFLoaded = async () => {
    const mod = await import("jspdf");
    return mod.jsPDF || mod.default || mod;
  };

  const ensureHtml2CanvasLoaded = async () => {
    const mod = await import("html2canvas");
    return mod.default || mod;
  };

  const loadImageAsDataURL = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (_) {
      return null;
    }
  };

  const parseTranscriptToChat = (raw) => {
    if (!raw || typeof raw !== "string") return [];
    const lines = raw.split("\n").filter((l) => l.trim());
    return lines.map((line) => {
      const isUser = /\]\s*User\s*\(/i.test(line) || /^User:/i.test(line);
      const isAI = !isUser;
      const text = line
        .replace(/^\[[^\]]+\]\s(User|AI)\s\([^\)]+\):\s*/, "")
        .replace(/^\[[^\]]+\]\s*/, "")
        .replace(/^(User|AI)\s*:\s*/i, "");
      let ts = "";
      const m = line.match(/\[([^\]]+)\]/);
      if (m && m[1]) {
        const d = new Date(m[1]);
        if (!isNaN(d.getTime())) {
          ts = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
      }
      return { isUser, isAI, text, timestamp: ts };
    });
  };

  const downloadLogTranscriptPdf = async (log) => {
    try {
      setDownloadingId(log._id);
      // Prefer transcript from log; if absent, try fetching by unique id
      let transcript = log?.transcript || "";
      if (!transcript) {
        try {
          const token = sessionStorage.getItem("clienttoken");
          const uniqueId =
            log?.metadata?.customParams?.uniqueid ||
            log?.uniqueId ||
            log?.uniqueid ||
            "";
          if (uniqueId) {
            const resp = await fetch(
              `${API_BASE_URL}/client/call-logs/transcript/${uniqueId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (resp.ok) {
              const data = await resp.json();
              if (data?.success && data?.data?.transcript) {
                transcript = data.data.transcript;
              }
            }
          }
        } catch (_) {}
      }

      if (!transcript) {
        alert("No transcript available for this call");
        return;
      }

      const [jsPDFCtor, html2canvas] = await Promise.all([
        ensureJsPDFLoaded(),
        ensureHtml2CanvasLoaded(),
      ]);
      const doc = new jsPDFCtor({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 40;
      let cursorY = 60;

      // Header branding
      try {
        const dataUrl = await loadImageAsDataURL("/AitotaLogo.png");
        if (dataUrl) {
          const logoW = 60;
          const logoH = 60;
          doc.addImage(
            dataUrl,
            "PNG",
            pageWidth - marginX - logoW,
            30,
            logoW,
            logoH
          );
        }
      } catch (_) {}

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Call Transcript", marginX, cursorY);
      cursorY += 26;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const phone = log?.mobile || "-";
      const dateStr = log?.time
        ? new Date(log.time).toLocaleString()
        : new Date().toLocaleString();
      const mins = Math.floor((log?.duration || 0) / 60);
      const secs = Math.floor((log?.duration || 0) % 60);
      const durationStr = `${String(mins).padStart(2, "0")}:${String(
        secs
      ).padStart(2, "0")}`;

      [
        `Name: -`,
        `Mobile: ${phone}`,
        `Date & Time: ${dateStr}`,
        `Duration: ${durationStr}`,
      ].forEach((l) => {
        doc.text(l, marginX, cursorY);
        cursorY += 16;
      });

      cursorY += 8;
      doc.setDrawColor(220);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 20;

      // Chat header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Conversation", marginX, cursorY);
      cursorY += 12;

      const chatMessages = parseTranscriptToChat(transcript);

      // Offscreen container and rasterization
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.width = "560px";
      container.style.padding = "6px";
      container.style.background = "#ffffff";
      container.style.color = "#111827";
      container.style.fontFamily =
        'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Noto Sans", "Noto Sans Devanagari", sans-serif';
      container.style.fontSize = "12px";
      container.style.lineHeight = "1.4";
      document.body.appendChild(container);

      const createBubbleNode = (msg) => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.marginBottom = "6px";
        wrapper.style.width = "100%";
        wrapper.style.boxSizing = "border-box";
        wrapper.style.justifyContent = msg.isUser
          ? "flex-end"
          : msg.isAI
          ? "flex-start"
          : "center";

        const bubble = document.createElement("div");
        bubble.style.maxWidth = "72%";
        bubble.style.borderRadius = "10px";
        bubble.style.padding = "8px 10px";
        bubble.style.boxSizing = "border-box";
        bubble.style.whiteSpace = "pre-wrap";
        bubble.style.wordBreak = "break-word";
        bubble.style.border = msg.isAI
          ? "1px solid #93c5fd"
          : msg.isUser
          ? "1px solid #d1d5db"
          : "1px solid #e5e7eb";
        bubble.style.background = msg.isAI
          ? "#e0f2fe"
          : msg.isUser
          ? "#f3f4f6"
          : "#f9fafb";
        bubble.style.color = "#111827";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "baseline";
        header.style.gap = "6px";
        header.style.marginBottom = "4px";

        const who = document.createElement("strong");
        who.textContent = msg.isAI ? "AI" : msg.isUser ? "User" : "System";
        who.style.fontSize = "11px";

        const tsSpan = document.createElement("span");
        tsSpan.style.fontSize = "10px";
        tsSpan.style.color = "#6B7280";
        tsSpan.textContent = msg.timestamp || "";

        header.appendChild(who);
        if (msg.timestamp) header.appendChild(tsSpan);

        const text = document.createElement("div");
        text.style.fontSize = "12px";
        text.textContent = msg.text || "";

        bubble.appendChild(header);
        bubble.appendChild(text);
        wrapper.appendChild(bubble);
        return wrapper;
      };

      const scale = 1.25;
      const pageWidthPt = pageWidth;
      const imgWidth = pageWidthPt - marginX * 2;
      const containerWidthPx = parseInt(container.style.width, 10) || 560;
      const pageHeight = doc.internal.pageSize.getHeight();
      const bottomMargin = 40;
      const calcMaxContentPx = (availablePt) =>
        Math.floor((availablePt * containerWidthPx) / imgWidth);

      let pageDiv = document.createElement("div");
      pageDiv.style.width = "100%";
      pageDiv.style.boxSizing = "border-box";
      container.appendChild(pageDiv);

      const renderCurrentPage = async (cursorYForPage) => {
        const canvas = await html2canvas(pageDiv, {
          scale,
          backgroundColor: "#ffffff",
        });
        const drawHeight = (canvas.height / canvas.width) * imgWidth;
        const imgData = canvas.toDataURL("image/jpeg", 0.72);
        doc.addImage(
          imgData,
          "JPEG",
          marginX,
          cursorYForPage,
          imgWidth,
          drawHeight
        );
      };

      const firstPageMaxPx = calcMaxContentPx(
        pageHeight - cursorY - bottomMargin
      );
      const nextPagesMaxPx = calcMaxContentPx(pageHeight - 60 - bottomMargin);
      let isFirstPage = true;

      for (let i = 0; i < chatMessages.length; i++) {
        const node = createBubbleNode(chatMessages[i]);
        pageDiv.appendChild(node);
        const maxPx = isFirstPage ? firstPageMaxPx : nextPagesMaxPx;
        if (pageDiv.scrollHeight > maxPx && pageDiv.childElementCount > 1) {
          pageDiv.removeChild(node);
          await renderCurrentPage(isFirstPage ? cursorY : 60);
          doc.addPage();
          isFirstPage = false;
          pageDiv = document.createElement("div");
          pageDiv.style.width = "100%";
          pageDiv.style.boxSizing = "border-box";
          container.innerHTML = "";
          container.appendChild(pageDiv);
          pageDiv.appendChild(node);
        }
      }
      if (pageDiv.childElementCount > 0) {
        await renderCurrentPage(isFirstPage ? cursorY : 60);
      }
      if (container && container.parentNode)
        container.parentNode.removeChild(container);

      // Footer branding
      const footer = "Powered by AItota";
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      const footerY = doc.internal.pageSize.getHeight() - 30;
      doc.text(footer, pageWidth - marginX - doc.getTextWidth(footer), footerY);

      const safePhone = String(phone || "").replace(/\D/g, "");
      const fileName = `AItota_Transcript_${safePhone || "call"}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error("Failed to generate transcript PDF", e);
      alert("Unable to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!agentId || !clientId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Agent information not available</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .no-thumb::-webkit-slider-thumb {
          display: none !important;
        }
        .no-thumb::-moz-range-thumb {
          display: none !important;
        }
      `}</style>
      <div className="space-y-6 px-16 py-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiPhone className="w-5 h-5" />
            Call Logs
          </h3>
          {agent && (
            <p className="text-sm text-gray-600">
              Call history for {agent.agentName}
            </p>
          )}
        </div>
        <button
          onClick={fetchCallLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalCalls}
                </p>
              </div>
              <FiPhone className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.totalConnected}
                </p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Not Connected
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.totalNotConnected}
                </p>
              </div>
              <FiXCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Duration
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatTime(statistics.avgCallDuration)}
                </p>
              </div>
              <FiClock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {["today", "yesterday", "last7days", "last30days"].map(
              (filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => handleFilterChange(filterOption)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filter === filterOption
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filterOption
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Custom Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(startDate || endDate) && (
              <button
                onClick={handleDateRangeChange}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <FiRefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading call logs...</p>
        </div>
      )}

      {/* Call Logs Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <FiPhone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No call logs found for the selected period
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Logs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-4 h-4 text-gray-400" />
                            {formatDate(log.time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FiPhone className="w-4 h-4 text-gray-400" />
                            {log.mobile || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            {formatTime(log.duration)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeadStatusColor(
                              log.leadStatus
                            )}`}
                          >
                            {getLeadStatusLabel(log.leadStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openTranscriptPopup(log)}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                              title="View Transcript"
                            >
                              <FiFileText className="w-4 h-4" />
                              <span>Transcript</span>
                            </button>
                            <button
                              onClick={() => downloadLogTranscriptPdf(log)}
                              className={`p-2 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors ${
                                downloadingId === log._id
                                  ? "opacity-60 cursor-wait"
                                  : ""
                              }`}
                              title="Download PDF"
                              disabled={downloadingId === log._id}
                            >
                              {downloadingId === log._id ? (
                                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FiDownload className="w-4 h-4 text-gray-700" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {currentPage} of {totalPages} ({totalLogs}{" "}
                    total logs)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Transcript Popup */}
      {showTranscriptPopup && selectedTranscript && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FiFileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Call Transcript
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedTranscript.mobile} -{" "}
                    {formatTranscriptDate(selectedTranscript.time)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                
                {/* Audio Download Button */}
                {audioUrl && audioAvailable && (
                  <button
                    onClick={handleDownloadAudio}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    title="Download Audio"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span className="text-sm">Download</span>
                  </button>
                )}
                {/* Play/Pause Button */}
                {audioUrl && audioAvailable && (
                  <button
                    onClick={handlePlayPause}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={closeTranscriptPopup}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Hidden audio element */}
            {audioUrl ? (
              <audio
                key={selectedCall?._id || 'call-audio'}
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('Audio load error:', e);
                  setAudioAvailable(false);
                }}
              />
            ) : null}

            {/* Audio Timeline */}
            {audioUrl && audioAvailable && audioDuration > 0 && (
              <div className="px-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max={audioDuration || 0}
                      step="0.1"
                      value={audioCurrentTime || 0}
                      onChange={(e) => {
                        const newTime = parseFloat(e.target.value);
                        if (audioRef.current) {
                          audioRef.current.currentTime = newTime;
                          setAudioCurrentTime(newTime);
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer no-thumb"
                      style={{
                        background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((audioCurrentTime || 0) / (audioDuration || 1)) * 100}%, #e5e7eb ${((audioCurrentTime || 0) / (audioDuration || 1)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 font-mono whitespace-nowrap">
                    {formatDuration(audioCurrentTime)} / {formatDuration(audioDuration)}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 pb-4">
              {selectedTranscript.transcript ? (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Conversation Transcript
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto max-h-[calc(90vh-120px)] pb-10">
                    {(() => {
                      const rawLines = selectedTranscript.transcript
                        .split("\n")
                        .filter((line) => line.trim());

                      const messages = [];
                      let current = null;

                      for (const line of rawLines) {
                        // Try to extract timestamp like [2025-08-16T07:20:20.885Z]
                        const tsMatch = line.match(/\[([^\]]+)\]/);
                        let ts = null;
                        if (tsMatch) {
                          const d = new Date(tsMatch[1]);
                          if (!isNaN(d.getTime())) {
                            ts = d.toLocaleTimeString();
                          }
                        }

                        // Remove timestamp prefix
                        const withoutTs = line.replace(/\[[^\]]+\]\s*/, "");

                        // Determine speaker and text
                        const colonIdx = withoutTs.indexOf(":");
                        let speaker = "System";
                        let text = withoutTs;
                        if (colonIdx !== -1) {
                          speaker = withoutTs.substring(0, colonIdx).trim();
                          text = withoutTs.substring(colonIdx + 1).trim();
                        }

                        const isAgent = /^(ai|agent)/i.test(speaker);
                        const isUser = /^(user|customer)/i.test(speaker);

                        // Group consecutive lines from same speaker
                        if (
                          current &&
                          current.role ===
                            (isAgent ? "agent" : isUser ? "user" : "system")
                        ) {
                          current.text += (current.text ? " " : "") + text;
                          current.ts = ts || current.ts;
                        } else {
                          if (current) messages.push(current);
                          current = {
                            role: isAgent
                              ? "agent"
                              : isUser
                              ? "user"
                              : "system",
                            text,
                            ts,
                          };
                        }
                      }
                      if (current) messages.push(current);

                      return (
                        <div className="space-y-3 pb-8">
                          {messages.map((m, idx) => (
                            <div
                              key={idx}
                              className={`flex ${
                                m.role === "user"
                                  ? "justify-end"
                                  : m.role === "agent"
                                  ? "justify-start"
                                  : "justify-center"
                              }`}
                            >
                              {m.role === "system" ? (
                                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {m.text}
                                </div>
                              ) : (
                                <div
                                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm shadow-sm ${
                                    m.role === "agent"
                                      ? "bg-white border border-gray-200 text-gray-800"
                                      : "bg-blue-600 text-white"
                                  }`}
                                >
                                  <div className="font-medium mb-1 text-xs opacity-75">
                                    {m.role === "agent" ? "Agent" : "User"}
                                    {m.ts && (
                                      <span
                                        className={`ml-2 ${
                                          m.role === "agent"
                                            ? "text-gray-400"
                                            : "text-blue-100"
                                        }`}
                                      >
                                        {m.ts}
                                      </span>
                                    )}
                                  </div>
                                  <div className="leading-relaxed">
                                    {m.text}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Transcript Available
                  </h4>
                  <p className="text-gray-600">
                    This call doesn't have a transcript recorded yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default CallLogs;
