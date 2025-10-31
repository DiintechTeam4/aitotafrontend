import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiX,
  FiPlus,
  FiUsers,
  FiCalendar,
  FiTrash2,
  FiPhone,
  FiPlay,
  FiPause,
  FiClock,
  FiSkipForward,
  FiUser,
  FiBarChart2,
  FiUserPlus,
  FiFolder,
  FiDownload,
  FiLoader
} from "react-icons/fi";
import { FaWhatsapp, FaPlay, FaPause } from "react-icons/fa";
import { API_BASE_URL } from "../../../config";
const API_BASE = `${API_BASE_URL}/client`;
function CampaignDetails({ campaignId, onBack }) {
  const [campaign, setCampaign] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTogglingCampaign, setIsTogglingCampaign] = useState(false);
  const [addingGroups, setAddingGroups] = useState(false);
  const [autoRefreshCalls, setAutoRefreshCalls] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentMap, setAgentMap] = useState({});
  const [waChatOpen, setWaChatOpen] = useState(false);
  const [waChatMessages, setWaChatMessages] = useState([]);
  const [waChatInput, setWaChatInput] = useState("");
  const [waTyping, setWaTyping] = useState(false);
  const [waChatContact, setWaChatContact] = useState({ name: "", number: "" });
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingTxt, setIsDownloadingTxt] = useState(false);
  const [isDownloadingReportCSV, setIsDownloadingReportCSV] = useState(false);
  const [isDownloadingReportPDF, setIsDownloadingReportPDF] = useState(false);
  const [isDownloadingReportTXT, setIsDownloadingReportTXT] = useState(false);
  const [isDownloadingHistoryCSV, setIsDownloadingHistoryCSV] = useState(false);
  const [isDownloadingHistoryPDF, setIsDownloadingHistoryPDF] = useState(false);
  const [isDownloadingHistoryTXT, setIsDownloadingHistoryTXT] = useState(false);
  const [waTemplatesOpen, setWaTemplatesOpen] = useState(false);
  const [waTemplates, setWaTemplates] = useState([]);
  const [waTemplatesLoading, setWaTemplatesLoading] = useState(false);
  const [waChatDeadline, setWaChatDeadline] = useState(null);
  const [waChatRemaining, setWaChatRemaining] = useState("24:00:00");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showHistoryDownloadMenu, setShowHistoryDownloadMenu] = useState(false);
  const [showReportDownloadMenu, setShowReportDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);
  const token = sessionStorage.getItem("clienttoken");
  console.log("token", token);
  

  const handlePlayPause = () => {
    if (!audioUrl || !audioRef.current) {
      try { toast?.warn?.('No recording available'); } catch {}
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };
  useEffect(() => {
    const handleDocClick = (e) => {
      try {
        if (
          showDownloadMenu &&
          downloadMenuRef.current &&
          !downloadMenuRef.current.contains(e.target)
        ) {
          setShowDownloadMenu(false);
        }
      } catch (_) {}
    };
    const handleClick = (e) => {
      if (e.target.closest('[data-filter-button]')) {
        return;
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("click", handleClick, true);
    };
  }, [showDownloadMenu]);
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [campaignHistoryLoading, setCampaignHistoryLoading] = useState(false);
  const [currentRunId, setCurrentRunId] = useState(null);
  const [runStartTime, setRunStartTime] = useState(null);
  const [campaignStartTime, setCampaignStartTime] = useState(null);
  const [currentRunCallLogs, setCurrentRunCallLogs] = useState([]);
  const [isSeriesMode, setIsSeriesMode] = useState(false);
  const [agentConfigMode, setAgentConfigMode] = useState("serial");
  const [agentConfigLoading, setAgentConfigLoading] = useState(false);
  const [agentDispositions, setAgentDispositions] = useState([]);
  const autoSavingRef = useRef(false);
  const lastSavedRunIdRef = useRef(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportRuns, setReportRuns] = useState([]);
  const [reportSelectedIds, setReportSelectedIds] = useState(new Set());
  const closeReport = () => setIsReportOpen(false);
  const handleDownloadSelectedReportPDF = async () => {
    try {
      setIsDownloadingReportPDF(true);
      if (!reportSelectedIds || reportSelectedIds.size === 0) {
        toast.warn("Select at least one row");
        return;
      }
      await Promise.all([
        ensureJsPDFLoaded(),
        ensurePdfLibLoaded(),
        ensureHtml2CanvasLoaded(),
      ]);
      // Prepare flat rows from reportRuns
      const rows = (reportRuns || [])
        .flatMap((run) =>
          (run.contacts || []).map((c) => ({ ...c, __run: run }))
        )
        .filter((c) => reportSelectedIds.has(c.documentId));
      if (rows.length === 0) {
        toast.warn("Nothing selected");
        return;
      }
      const pdfBuffers = [];
      for (const r of rows) {
        const buf = await generateTranscriptPdfForDocument(r);
        if (buf) pdfBuffers.push(buf);
      }
      if (pdfBuffers.length === 0) {
        toast.error("Failed to build PDFs for selection");
        return;
      }
      const { PDFDocument } = window.PDFLib || {};
      if (!PDFDocument) throw new Error("PDF library not available");
      const merged = await PDFDocument.create();
      for (const ab of pdfBuffers) {
        const src = await PDFDocument.load(ab);
        const copiedPages = await merged.copyPages(src, src.getPageIndices());
        copiedPages.forEach((p) => merged.addPage(p));
      }
      const mergedBytes = await merged.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campaign_${campaignId}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download report failed:", e);
      toast.error("Failed to download report");
    } finally {
      setIsDownloadingReportPDF(false);
    }
  };
  const fetchTranscriptTextByDocument = async (documentId) => {
    try {
      if (!documentId) return "";
      const token = sessionStorage.getItem("clienttoken");
      let transcript = "";
      try {
      const resp = await fetch(
        `${API_BASE}/whatsapp/get-transcript-by-document/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
        if (resp.ok) {
      const result = await resp.json();
          transcript = result?.transcript || "";
        }
      } catch (_) {
      }
      if (!transcript && campaignId) {
        try {
          const resp2 = await fetch(
            `${API_BASE}/campaigns/${campaignId}/logs/${documentId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (resp2.ok) {
            const result2 = await resp2.json();
            transcript = result2?.transcript || "";
          }
        } catch (_) {
        }
      }
      return transcript || "";
    } catch (_) {
      return "";
    }
  };
  const handleDownloadSelectedReportTXT = async () => {
    try {
      setIsDownloadingReportTXT(true);
      if (!reportSelectedIds || reportSelectedIds.size === 0) {
        toast.warn("Select at least one row");
        return;
      }
      const flatRows = (reportRuns || [])
        .flatMap((run) => (run.contacts || []).map((c) => ({ ...c, __run: run })))
        .filter((c) => reportSelectedIds.has(c.documentId));
      if (flatRows.length === 0) {
        toast.warn("Nothing selected");
        return;
      }
      let parts = [];
      for (const r of flatRows) {
        const transcript = await fetchTranscriptTextByDocument(r.documentId);
        const body = String(transcript || "").trim();
        if (!body) continue; // skip empty transcripts
        const headerLines = [
          `Name: ${r.name || "-"}`,
          `Number: ${r.number || r.phone || "-"}`,
          `Document: ${r.documentId}`,
        ];
        parts.push(headerLines.join("\n") + "\n\n" + body);
      }
      if (parts.length === 0) {
        toast.warn("No transcripts available for selected");
        return;
      }
      const content = parts.join("\n\n==============================\n\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AItota_Report_Selected_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("TXT report download failed:", e);
      try { toast.error("Failed to download TXT report"); } catch {}
    } finally {
      setIsDownloadingReportTXT(false);
    }
  };
  const handleDownloadSelectedReportCSV = async () => {
    try {
      setIsDownloadingReportCSV(true);
      if (!reportSelectedIds || reportSelectedIds.size === 0) {
        toast.warn("Select at least one row");
        return;
      }
      const flatRows = (reportRuns || [])
        .flatMap((run) => (run.contacts || []).map((c) => ({ ...c, __run: run })))
        .filter((c) => reportSelectedIds.has(c.documentId));
      if (flatRows.length === 0) {
        toast.warn("Nothing selected");
        return;
      }
      const headers = [
        "Number",
        "Name",
        "Transcripts",
        "DurationSeconds",
        "DurationFormatted",
        "Disposition",
        "CampaignName",
        "ClientName",
        "AgentName",
      ];
      const escapeCsv = (val) => {
        const s = (val == null ? "" : String(val));
        if (/[",\n]/.test(s)) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };
      const normalizeDigits = (v) => String(v || "").replace(/[^\d+]/g, "");
      const excelTextNumber = (v) => `="${normalizeDigits(v)}"`;
      const rows = [headers.join(",")];
      // Resolve agent and client names once
      let agentName = "";
      try {
        const primaryId = getPrimaryAgentId();
        if (primaryId) {
          agentName = (await getAgentNameById(primaryId)) || "";
        }
      } catch (_) {}
      const campaignName = campaign?.name || "";
      const clientName = clientData?.name || "";
      for (const r of flatRows) {
        let msgCount = (typeof r.transcriptCount === "number" ? r.transcriptCount : getTranscriptMessageCount(r)) || 0;
        if (msgCount === 0 && r.documentId) {
          try {
            const transcript = await fetchTranscriptTextByDocument(r.documentId);
            if (transcript) {
              msgCount = countMessagesInTranscript(transcript) || 0;
            }
          } catch (_) {}
        }
        const durationSec = Number(r.duration || r.durationSeconds || 0) || 0;
        const durationFmt = formatHMSCompact(durationSec);
        const disposition = r.leadStatus || r.disposition || r.status || "";
        rows.push([
          excelTextNumber(r.number || r.phone || "-"),
          escapeCsv(r.name || "-"),
          String(msgCount),
          String(durationSec),
          escapeCsv(durationFmt),
          escapeCsv(disposition),
          escapeCsv(campaignName),
          escapeCsv(clientName),
          escapeCsv(agentName),
        ].join(","));
      }
      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AItota_Report_Selected_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("CSV report download failed:", e);
      try { toast.error("Failed to download Excel (CSV)"); } catch {}
    } finally {
      setIsDownloadingReportCSV(false);
    }
  };
  const handleDownloadSelectedHistoryPDF = async () => {
    try {
      setIsDownloadingHistoryPDF(true);
      const rows = (selectedCallLogs || []).filter((c) => !!c.documentId);
      if (!rows.length) {
        toast.warn("Select at least one item with transcript");
        return;
      }
      const pdfBuffers = [];
      for (const r of rows) {
        const buf = await generateTranscriptPdfForDocument(r);
        if (buf) pdfBuffers.push(buf);
      }
      if (pdfBuffers.length === 0) {
        toast.warn("No transcripts available for selected");
        return;
      }
      const PDFLib = await ensurePdfLibLoaded();
      const mergedPdf = await PDFLib.PDFDocument.create();
      for (const arrBuf of pdfBuffers) {
        const src = await PDFLib.PDFDocument.load(arrBuf);
        const pages = await mergedPdf.copyPages(src, src.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
      }
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AItota_Selected_Transcripts_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Downloading PDF...");
    } catch (e) {
      console.error("Selected PDF download failed:", e);
      try { toast.error("Failed to download selected PDF"); } catch {}
    } finally {
      setIsDownloadingHistoryPDF(false);
    }
  };
  const handleDownloadSelectedHistoryTXT = async () => {
    try {
      setIsDownloadingHistoryTXT(true);
      const rows = (selectedCallLogs || []).filter((c) => !!c.documentId);
      if (!rows.length) {
        toast.warn("Select at least one item with transcript");
        return;
      }
      let parts = [];
      for (const r of rows) {
        const transcript = await fetchTranscriptTextByDocument(r.documentId);
        const body = String(transcript || "").trim();
        if (!body) continue; // skip empty transcripts
        const headerLines = [
          `Name: ${r.name || "-"}`,
          `Number: ${r.number || r.phone || "-"}`,
          `Document: ${r.documentId}`,
        ];
        parts.push(headerLines.join("\n") + "\n\n" + body);
      }
      if (parts.length === 0) {
        toast.warn("No transcripts available for selected");
        return;
      }
      const content = parts.join("\n\n==============================\n\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AItota_Selected_Transcripts_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Selected TXT download failed:", e);
      try { toast.error("Failed to download selected TXT"); } catch {}
    } finally {
      setIsDownloadingHistoryTXT(false);
    }
  };
  const handleDownloadSelectedHistoryCSV = async () => {
    try {
      setIsDownloadingHistoryCSV(true);
      const rows = selectedCallLogs || [];
      if (!rows.length) {
        toast.warn("Select at least one item");
        return;
      }
      const headers = [
        "Number",
        "Name",
        "Transcripts",
        "DurationSeconds",
        "DurationFormatted",
        "Disposition",
        "CampaignName",
        "ClientName",
        "AgentName",
      ];
      const escapeCsv = (val) => {
        const s = (val == null ? "" : String(val));
        if (/[",\n]/.test(s)) { return '"' + s.replace(/"/g, '""') + '"'; }
        return s;
      };
      const normalizeDigits = (v) => String(v || "").replace(/[^\d+]/g, "");
      const excelTextNumber = (v) => `="${normalizeDigits(v)}"`;
      const lines = [headers.join(",")];
      let agentName = "";
      try {
        const primaryId = getPrimaryAgentId();
        if (primaryId) {
          agentName = (await getAgentNameById(primaryId)) || "";
        }
      } catch (_) {}
      const campaignName = campaign?.name || "";
      const clientName = clientData?.name || "";
      for (const r of rows) {
        let msgCount = (typeof r.transcriptCount === "number" ? r.transcriptCount : getTranscriptMessageCount(r)) || 0;
        if (msgCount === 0 && r.documentId) {
          try {
            const transcript = await fetchTranscriptTextByDocument(r.documentId);
            if (transcript) {
              msgCount = countMessagesInTranscript(transcript) || 0;
            }
          } catch (_) {}
        }
        const durationSec = Number(r.duration || r.durationSeconds || 0) || 0;
        const durationFmt = formatHMSCompact(durationSec);
        const disposition = r.leadStatus || r.disposition || r.status || "";
        lines.push([
          excelTextNumber(r.number || r.phone || "-"),
          escapeCsv(r.name || "-"),
          String(msgCount),
          String(durationSec),
          escapeCsv(durationFmt),
          escapeCsv(disposition),
          escapeCsv(campaignName),
          escapeCsv(clientName),
          escapeCsv(agentName),
        ].join(","));
      }
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AItota_Selected_Contacts_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Selected CSV download failed:", e);
      try { toast.error("Failed to download Excel (CSV)"); } catch {}
    } finally {
      setIsDownloadingHistoryCSV(false);
    }
  };
  useEffect(() => {
    const key = `campaign_${campaignId}_lastSavedRunId`;
    const persisted = sessionStorage.getItem(key);
    if (persisted) {
      lastSavedRunIdRef.current = persisted;
    }
  }, [campaignId]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [selectAllContacts, setSelectAllContacts] = useState(false);
  const [selectedCallLogs, setSelectedCallLogs] = useState([]);
  const [selectAllCallLogs, setSelectAllCallLogs] = useState(false);
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "";
    const digits = String(phoneNumber).replace(/[^\d]/g, "");
    const cleanDigits = digits.startsWith("0") ? digits.substring(1) : digits;
    if (cleanDigits.length === 10) {
      return `+91${cleanDigits}`;
    }
    if (cleanDigits.length === 12 && cleanDigits.startsWith("91")) {
      return `+${cleanDigits}`;
    }
    if (cleanDigits.length === 11 && cleanDigits.startsWith("91")) {
      return `+${cleanDigits}`;
    }
    if (cleanDigits.length >= 10) {
      const last10Digits = cleanDigits.slice(-10);
      return `+91${last10Digits}`;
    }
    return `+91${cleanDigits}`;
  };
  const formatMessageTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid Date";
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isYesterday =
        new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() ===
        date.toDateString();
      if (isToday) {
        return `Today ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else if (isYesterday) {
        return `Yesterday ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else {
        return `${date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })} ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
    } catch (error) {
      console.error("Error formatting message timestamp:", error);
      return "Error";
    }
  };
  // Helper function to get date label for separators
  const getDateLabel = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid Date";
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isYesterday =
        new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() ===
        date.toDateString();
      if (isToday) {
        return "Today";
      } else if (isYesterday) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString([], {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch (error) {
      console.error("Error getting date label:", error);
      return "Error";
    }
  };
  const renderMessagesWithDateSeparators = () => {
    if (!waChatMessages || waChatMessages.length === 0) return null;
    const elements = [];
    let lastDate = null;
    waChatMessages.forEach((message, index) => {
      const messageDate =
        message.time instanceof Date ? message.time : new Date(message.time);
      const currentDateString = messageDate.toDateString();
      if (lastDate !== currentDateString) {
        elements.push(
          <div
            key={`date-${index}`}
            className="flex items-center justify-center my-4"
          >
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mx-2">
              {getDateLabel(message.time)}
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        );
        lastDate = currentDateString;
      }
      elements.push(
        <div
          key={message.id}
          className={`flex ${
            message.side === "right" ? "justify-end" : "justify-start"
          } mb-3`}
        >
          <div
            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-all duration-200 hover:shadow-md ${
              message.side === "right"
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-md"
                : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
            }`}
          >
            <div className="break-words leading-relaxed">{message.text}</div>
            <div
              className={`text-[10px] mt-2 ${
                message.side === "right" ? "text-green-100" : "text-gray-500"
              }`}
            >
              {formatMessageTimestamp(message.time)}
            </div>
          </div>
        </div>
      );
    });
    return elements;
  };
  // Function to fetch WhatsApp templates
  const fetchWaTemplates = async () => {
    setWaTemplatesLoading(true);
    try {
      const response = await fetch(
        "https://whatsapp-template-module.onrender.com/api/whatsapp/get-templates"
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.templates) {
          setWaTemplates(data.templates);
        } else {
          console.error("Failed to fetch templates:", data);
          setWaTemplates([]);
        }
      } else {
        console.error("Failed to fetch templates:", response.status);
        setWaTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
      setWaTemplates([]);
    } finally {
      setWaTemplatesLoading(false);
    }
  };
  // Function to toggle template selector
  const toggleWaTemplates = async () => {
    if (!waTemplatesOpen) {
      await fetchWaTemplates();
    }
    setWaTemplatesOpen(!waTemplatesOpen);
  };
  // Function to send template message using template-specific API
  const sendWaTemplateMessage = async (template) => {
    if (!waChatContact?.number) return;
    // Get the template body text to show in chat
    const templateBody =
      template.components?.find((c) => c.type === "BODY")?.text ||
      `Template: ${template.name}`;
    const msg = {
      id: Date.now(),
      text: templateBody,
      side: "right",
      time: new Date(),
    };
    setWaChatMessages((prev) => [...prev, msg]);
    setWaTemplatesOpen(false);
    setWaTyping(true);
    try {
      const normalizedNumber = normalizePhoneNumber(waChatContact.number);
      // Create template-specific API URL
      const templateApiUrl = `https://whatsapp-template-module.onrender.com/api/whatsapp/send-${template.name}`;
      console.log(`Sending template "${template.name}" via: ${templateApiUrl}`);
      const response = await fetch(templateApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: normalizedNumber,
          // You can add other template-specific parameters here if needed
        }),
      });
      const result = await response.json();
      if (result.success) {
        console.log(
          `WhatsApp template "${template.name}" sent successfully:`,
          result.messageId
        );
        // After template success, also send the template text as a regular message
        try {
          const templateText = template.components?.find(
            (c) => c.type === "BODY"
          )?.text;
          if (templateText) {
            const textResponse = await fetch(
              "https://whatsapp-template-module.onrender.com/api/whatsapp/send-message",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: normalizedNumber,
                  message: templateText,
                }),
              }
            );
            const textResult = await textResponse.json();
            if (textResult.success) {
              console.log("Template text message also sent successfully");
            } else {
              console.log("Template sent but text message failed:", textResult);
            }
          }
        } catch (textError) {
          console.log("Template sent but text message failed:", textError);
        }
        // Refresh messages after sending
        await fetchWaChatMessages(normalizedNumber);
      } else {
        console.error(
          `Failed to send WhatsApp template "${template.name}":`,
          result
        );
        // Add error message to chat
        setWaChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: `Failed to send ${template.name} template. Please try again.`,
            side: "left",
            time: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error(
        `Error sending WhatsApp template "${template.name}":`,
        error
      );
      // Add error message to chat
      setWaChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `Error sending ${template.name} template. Please try again.`,
          side: "left",
          time: new Date(),
        },
      ]);
    } finally {
      setWaTyping(false);
    }
  };
  const openWhatsAppMiniChat = async (lead) => {
    const derivedName =
      lead?.name ||
      lead?.contactName ||
      lead?.fullName ||
      lead?.agentName ||
      "";
    const derivedNumber =
      lead?.number ||
      lead?.mobile ||
      lead?.phone ||
      lead?.metadata?.callerId ||
      "";
    // Normalize the phone number
    const normalizedNumber = normalizePhoneNumber(derivedNumber);
    setWaChatContact({ name: derivedName, number: normalizedNumber });
    setWaChatOpen(true);
    // Start a new 24h deadline whenever chat opens
    try {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setWaChatDeadline(deadline);
    } catch (_) {}
    // Fetch real messages from WhatsApp API
    await fetchWaChatMessages(normalizedNumber);
  };
  // Tick countdown every second while chat is open
  useEffect(() => {
    if (!waChatOpen || !waChatDeadline) return;
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, waChatDeadline.getTime() - now);
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, "0");
      setWaChatRemaining(`${hours}:${minutes}:${seconds}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [waChatOpen, waChatDeadline]);
  const fetchWaChatMessages = async (phoneNumber) => {
    try {
      const response = await fetch(
        `https://whatsapp-template-module.onrender.com/api/chat/messages/${phoneNumber}`
      );
      if (response.ok) {
        const messages = await response.json();
        // Convert API messages to chat format
        const formattedMessages = messages.map((msg) => ({
          id: msg._id,
          text: msg.text,
          side: msg.direction === "received" ? "left" : "right",
          time: new Date(msg.timestamp),
          messageId: msg.messageId,
          type: msg.type,
          status: msg.status,
        }));
        setWaChatMessages(formattedMessages);
        // Persist fetched messages to backend (upsert)
        try {
          await saveWaChatToBackend(
            formattedMessages,
            phoneNumber,
            waChatContact?.name || ""
          );
        } catch (_) {}
      } else {
        console.error("Failed to fetch WhatsApp messages");
        setWaChatMessages([]);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      setWaChatMessages([]);
    }
  };
  const sendWaChatMessage = async () => {
    const text = waChatInput.trim();
    if (!text || !waChatContact?.number) return;
    const msg = { id: Date.now(), text, side: "right", time: new Date() };
    setWaChatMessages((prev) => [...prev, msg]);
    setWaChatInput("");
    setWaTyping(true);
    try {
      // Ensure the phone number is normalized before sending
      const normalizedNumber = normalizePhoneNumber(waChatContact.number);
      const response = await fetch(
        "https://whatsapp-template-module.onrender.com/api/whatsapp/send-message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: normalizedNumber,
            message: text,
          }),
        }
      );
      const result = await response.json();
      if (result.success) {
        console.log("WhatsApp message sent successfully:", result.messageId);
        // Refresh messages after sending
        await fetchWaChatMessages(normalizedNumber);
        // Avoid double-save: skip optimistic save because fetch immediately persists
      } else {
        console.error("Failed to send WhatsApp message:", result);
        // Add error message to chat
        setWaChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: "Failed to send message. Please try again.",
            side: "left",
            time: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      // Add error message to chat
      setWaChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Error sending message. Please try again.",
          side: "left",
          time: new Date(),
        },
      ]);
    } finally {
      setWaTyping(false);
    }
  };
  // Persist WhatsApp chat to backend (upsert per client+number)
  const saveWaChatToBackend = async (
    messages,
    phoneNumber,
    contactName = ""
  ) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token || !phoneNumber || !Array.isArray(messages)) return;
      const payload = {
        phoneNumber,
        contactName,
        messages: messages.map((m) => ({
          messageId: m.messageId || m.id,
          direction: m.direction || (m.side === "right" ? "sent" : "received"),
          text: m.text,
          status: m.status || "",
          type: m.type || "text",
          timestamp: m.time || m.timestamp || new Date(),
        })),
      };
      await fetch(`${API_BASE}/wa/chat/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // silent failure to avoid UX interruption
      console.warn("Failed to save WA chat:", e?.message);
    }
  };
  // Get agent ID from campaign data
  const getPrimaryAgentId = () => {
    if (Array.isArray(campaign?.agent) && campaign.agent.length > 0) {
      return campaign.agent[0];
    }
    return campaign?.agent || campaign?.agentId || null;
  };
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callingStatus, setCallingStatus] = useState("idle"); // idle, calling, paused, completed
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [callResults, setCallResults] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false); // Prevent multiple simultaneous start calls
  const [campaignGroups, setCampaignGroups] = useState([]);
  const [loadingCampaignGroups, setLoadingCampaignGroups] = useState(false);
  const [showGroupRangeModal, setShowGroupRangeModal] = useState(false);
  const [rangeModalLoading, setRangeModalLoading] = useState(false);
  const [rangeModalGroup, setRangeModalGroup] = useState(null);
  // Allow empty input; treat empty as undefined and validate on save
  const [rangeStartIndex, setRangeStartIndex] = useState("");
  const [rangeEndIndex, setRangeEndIndex] = useState("");
  const [selectedRangesDisplay, setSelectedRangesDisplay] = useState([]); // [{groupName,start,end}]
  const [selectedContactIndices, setSelectedContactIndices] = useState([]);
  const [groupModalTab, setGroupModalTab] = useState("range"); // 'range' | 'select'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAddGroupsModal, setShowAddGroupsModal] = useState(false);
  // Add Agent modal
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [selectedAgentIdForAssign, setSelectedAgentIdForAssign] = useState("");
  // Backend start/stop calling toggle state
  // Insufficient credits modal
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  // Transcript modal states
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [transcriptDocId, setTranscriptDocId] = useState(null);
  const [transcriptContent, setTranscriptContent] = useState("");
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [viewedTranscripts, setViewedTranscripts] = useState(new Set());
  // Track expanded state of history cards by a stable run key
  const [historyExpanded, setHistoryExpanded] = useState({});
  const [callFilter, setCallFilter] = useState("all");
  const [durationSort, setDurationSort] = useState("none"); // all | connected | missed
  const [rowDisposition, setRowDisposition] = useState({}); // { [rowId]: 'interested'|'not interested'|'maybe'|undefined }
  const [openDispositionFor, setOpenDispositionFor] = useState(null); // rowId for which dropdown is open
  const [rowDispositionPosition, setRowDispositionPosition] = useState({}); // { [rowId]: 'top'|'bottom' }
  // Filters for flag (local label) and disposition (from backend leadStatus/disposition)
  const [flagFilter, setFlagFilter] = useState("all"); // 'all'|'interested'|'not interested'|'maybe'|'do not call'|'unlabeled'
  const [dispositionFilter, setDispositionFilter] = useState("all"); // 'all' or a specific disposition/leadStatus
  const [flagMenuOpen, setFlagMenuOpen] = useState(false);
  const [dispMenuOpen, setDispMenuOpen] = useState(false);
  const [dispositionMenuOpen, setDispositionMenuOpen] = useState(false);
  const [flagMenuPosition, setFlagMenuPosition] = useState("bottom");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(() => {
    try { return localStorage.getItem(getStorageKey('filterBookmarkedOnly')) === 'true'; } catch (_) { return false; }
  });
  const [dispMenuPosition, setDispMenuPosition] = useState("bottom");
  // Function to calculate dropdown position
  const calculateDropdownPosition = (buttonElement) => {
    if (!buttonElement) return "bottom";
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 150;
    const shouldOpenUpward = spaceBelow < 200;
    console.log('Dropdown position calculation:', {
      spaceBelow,
      spaceAbove,
      viewportHeight,
      rectBottom: rect.bottom,
      shouldOpenUpward
    });
    return shouldOpenUpward ? "top" : "bottom";
  };
  const [apiMergedCallsLoading, setApiMergedCallsLoading] = useState(false);
  const [apiMergedCallsInitialLoad, setApiMergedCallsInitialLoad] =
    useState(true);
  const [apiMergedCallsPage, setApiMergedCallsPage] = useState(1);
  const [apiMergedCallsTotalPages, setApiMergedCallsTotalPages] = useState(0);
  const [apiMergedCallsTotalItems, setApiMergedCallsTotalItems] = useState(0);
  const [apiMergedCallsTotals, setApiMergedCallsTotals] = useState({
    totalItems: 0,
    totalConnected: 0,
    totalMissed: 0,
    totalDuration: 0,
    totalOngoing: 0,
    totalRinging: 0,
  });
  const [apiMergedCalls, setApiMergedCalls] = useState([]);
  const [apiMergedCallsLoadingMore, setApiMergedCallsLoadingMore] =
    useState(false);
  const [redialingCalls, setRedialingCalls] = useState(new Set());
  // Call details states
  const [showCallDetailsModal, setShowCallDetailsModal] = useState(false);
  const [callDetails, setCallDetails] = useState([]);
  const [callDetailsLoading, setCallDetailsLoading] = useState(false);
  const [callDetailsPage, setCallDetailsPage] = useState(1);
  const [callDetailsLimit] = useState(50);
  const [callDetailsMeta, setCallDetailsMeta] = useState({
    totalPages: 0,
    totalLogs: 0,
  });
  // Live call logs states
  const [selectedCall, setSelectedCall] = useState(null);
  const [showLiveCallModal, setShowLiveCallModal] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveTranscriptLines, setLiveTranscriptLines] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [liveCallDetails, setLiveCallDetails] = useState(null);
  const [transcriptCounts, setTranscriptCounts] = useState(new Map());
  const [openAssignFor, setOpenAssignFor] = useState(null);
  const [rowAssignments, setRowAssignments] = useState({});
  const [callConnectionStatus, setCallConnectionStatus] = useState("connected"); // connected, not_connected
  const [callResultsConnectionStatus, setCallResultsConnectionStatus] =
    useState({}); // Track connection status for each call result
  const [statusLogsCollapsed, setStatusLogsCollapsed] = useState(false);
  const logsPollRef = useRef(null);
  const transcriptRef = useRef(null);
  // When true, clear current dashboard lists to be ready for next run
  const [readyForNextRun, setReadyForNextRun] = useState(false);
  // Show all history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  // Collapsible Campaign Runs section
  const [campaignRunsCollapsed, setCampaignRunsCollapsed] = useState(false);
  // Auto-refresh recent call logs (toggleable). When enabled, refresh every 2 seconds
  const audioRef = useRef(null);
const [isPlaying, setIsPlaying] = useState(false);
const audioUrl = React.useMemo(() => {
  const raw = selectedCall?.audioUrl;
  const docId = selectedCall?.documentId;
  if (raw && /\/call-audio(\?|$)/.test(String(raw))) return raw;
  if (raw && /https?:\/\/[^\s]*s3[^\s]*amazonaws\.com\//i.test(String(raw)) && docId && campaignId) {
    return `${API_BASE}/campaigns/${campaignId}/call-audio?documentId=${encodeURIComponent(docId)}`;
  }
  if ((!raw || String(raw).trim() === '') && docId && campaignId) {
    return `${API_BASE}/campaigns/${campaignId}/call-audio?documentId=${encodeURIComponent(docId)}`;
  }
  if (!raw || String(raw).trim() === '') return undefined;
  return raw;
}, [selectedCall?._id, selectedCall?.audioUrl, selectedCall?.documentId, campaignId]);
useEffect(() => {
  setIsPlaying(false);
  if (audioRef.current) {
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch {}
  }
}, [selectedCall?._id]);
  useEffect(() => {
    if (!autoRefreshCalls) return;
    // Immediate fetch on enabling
    try {
      if (document.visibilityState === "visible") {
        fetchCampaignCallLogs(1);
        fetchApiMergedCalls(apiMergedCallsPage, true, true);
      }
    } catch (err) {}
    const intervalId = setInterval(() => {
      try {
        if (document.visibilityState === "visible") {
          fetchCampaignCallLogs(1);
          fetchApiMergedCalls(apiMergedCallsPage, true, true);
        }
      } catch (err) {}
    }, 2000);
    return () => clearInterval(intervalId);
  }, [autoRefreshCalls, apiMergedCallsPage]);
  const connectionTimeoutRef = useRef(null);
  // When campaign transitions from active -> inactive, refresh status once to update UI
  const prevIsRunningRef = useRef(campaign?.isRunning);
  useEffect(() => {
    const prev = prevIsRunningRef.current;
    if (prev === true && campaign?.isRunning === false) {
      fetchCampaignCallingStatus();
    }
    prevIsRunningRef.current = campaign?.isRunning;
  }, [campaign?.isRunning]);
  // Campaign contacts management states
  const [campaignContacts, setCampaignContacts] = useState([]);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showRestoreNotification, setShowRestoreNotification] = useState(false);
  // Format seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const total = Math.round(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };
  // Format seconds as MM:SSsec or HH:MM:SSsec when hours are present
  const formatHMSCompact = (seconds) => {
    const total = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const two = (n) => String(n).padStart(2, "0");
    return hours > 0
      ? `${two(hours)}:${two(minutes)}:${two(secs)}sec`
      : `${two(minutes)}:${two(secs)}sec`;
  };
  // Live run timer derived from campaignStartTime
  const [runSeconds, setRunSeconds] = useState(0);
  useEffect(() => {
    if (!campaign?.isRunning || !campaignStartTime) {
      setRunSeconds(0);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const start =
        campaignStartTime instanceof Date
          ? campaignStartTime.getTime()
          : new Date(campaignStartTime).getTime();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      setRunSeconds(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [campaign?.isRunning, campaignStartTime]);
  // Helper function to safely get contact name
  const getContactName = (contact) => {
    if (!contact) return "";
    if (contact.name && contact.name.trim()) {
      return contact.name.trim();
    }
    return "";
  };
  // Helper function to safely get contact display name
  const getContactDisplayName = (contact) => {
    const name = getContactName(contact);
    return name || "";
  };
  // Helper function to safely get contact display name (blank if no name)
  const getContactDisplayNameBlank = (contact) => {
    return getContactName(contact);
  };
  // Backend API now handles all merging, deduplication, and pagination
  // Tracks whether calling state was restored from storage to gate auto-resume
  const restoredFromStorageRef = useRef(false);
  
  // State persistence functions
  const getStorageKey = (key) => `campaign_${campaignId}_${key}`;
  // Lightweight bookmark helpers (local-only fallback)
  const isContactBookmarked = (contact) => {
    try {
      const raw = localStorage.getItem(getStorageKey('contactBookmarks')) || '[]';
      const arr = JSON.parse(raw);
      const id = contact?._id || contact?.contactId || contact?.documentId || contact?.phone || contact?.number;
      return id ? (arr || []).includes(id) : false;
    } catch (_) { return false; }
  };
  const toggleBookmarkForContact = (contact) => {
    try {
      const id = contact?._id || contact?.contactId || contact?.documentId || contact?.phone || contact?.number;
      const phone = String(contact?.phone || contact?.number || '').replace(/\D/g, '');
      if (!id && !phone) return;
      // Local optimistic toggle
      const raw = localStorage.getItem(getStorageKey('contactBookmarks')) || '[]';
      const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      const set = new Set(arr);
      if (set.has(id || phone)) set.delete(id || phone); else set.add(id || phone);
      localStorage.setItem(getStorageKey('contactBookmarks'), JSON.stringify(Array.from(set)));
      // Persist to backend when we have campaign and phone
      if (campaign?._id && phone) {
        (async () => {
          try {
            const token = sessionStorage.getItem('clienttoken');
            const willBe = set.has(id || phone);
            const resp = await fetch(`${API_BASE}/campaigns/${campaign._id}/contacts/bookmark-by-phone`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone, bookmarked: willBe })
            });
            if (!resp.ok) throw new Error('bookmark-by-phone failed');
            const result = await resp.json();
            if (!result.success) throw new Error('bookmark-by-phone failed');
          } catch (e) {
            // Revert local
            const raw2 = localStorage.getItem(getStorageKey('contactBookmarks')) || '[]';
            const arr2 = Array.isArray(JSON.parse(raw2)) ? JSON.parse(raw2) : [];
            const set2 = new Set(arr2);
            if (set2.has(id || phone)) set2.delete(id || phone); else set2.add(id || phone);
            localStorage.setItem(getStorageKey('contactBookmarks'), JSON.stringify(Array.from(set2)));
          }
        })();
      }
    } catch (_) {}
  };
  const saveCallingState = () => {
    const state = {
      showCallModal,
      callingStatus,
      currentContactIndex,
      callResults,
      selectedAgent,
      callResultsConnectionStatus,
      timestamp: Date.now(),
    };
    localStorage.setItem(getStorageKey("callingState"), JSON.stringify(state));
  };
  // Save filter states to localStorage
  const saveFilterStates = () => {
    const filterStates = {
      flagFilter,
      callFilter,
      dispositionFilter,
      rowDisposition,
      timestamp: Date.now(),
    };
    console.log("Saving filter states:", filterStates);
    localStorage.setItem(getStorageKey("filterStates"), JSON.stringify(filterStates));
  };
  // Persist selected ranges display so refresh retains last selection label
  useEffect(() => {
    try {
      const key = getStorageKey("selectedRangesDisplay");
      localStorage.setItem(key, JSON.stringify(selectedRangesDisplay || []));
    } catch (_) {}
  }, [campaignId, selectedRangesDisplay]);
  // Load selected ranges display on mount
  useEffect(() => {
    try {
      const key = getStorageKey("selectedRangesDisplay");
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedRangesDisplay(parsed);
          setShowRestoreNotification(true);
        }
      }
    } catch (_) {}
  }, [campaignId]);
  // Load filter states from localStorage
  const loadFilterStates = () => {
    try {
      const saved = localStorage.getItem(getStorageKey("filterStates"));
      if (saved) {
        const states = JSON.parse(saved);
        if (Date.now() - states.timestamp < 24 * 60 * 60 * 1000) {
          console.log("Restoring filter states:", states);
          if (states.flagFilter) {
            setFlagFilter(states.flagFilter);
            console.log("Restored flagFilter:", states.flagFilter);
          }
          if (states.callFilter) {
            setCallFilter(states.callFilter);
            console.log("Restored callFilter:", states.callFilter);
          }
          if (states.dispositionFilter) {
            setDispositionFilter(states.dispositionFilter);
            console.log("Restored dispositionFilter:", states.dispositionFilter);
          }
          if (states.rowDisposition) {
            setRowDisposition(states.rowDisposition);
            console.log("Restored rowDisposition:", states.rowDisposition);
          }
          return true;
        } else {
          // Clear old state
          localStorage.removeItem(getStorageKey("filterStates"));
        }
      }
    } catch (error) {
      console.error("Error loading filter states:", error);
    }
    return false;
  };
  const saveViewedTranscripts = () => {
    localStorage.setItem(
      getStorageKey("viewedTranscripts"),
      JSON.stringify(Array.from(viewedTranscripts))
    );
  };
  const loadViewedTranscripts = () => {
    try {
      const saved = localStorage.getItem(getStorageKey("viewedTranscripts"));
      if (saved) {
        const viewedArray = JSON.parse(saved);
        setViewedTranscripts(new Set(viewedArray));
      }
    } catch (error) {
      console.error("Error loading viewed transcripts:", error);
    }
  };
  const loadCallingState = () => {
    try {
      const saved = localStorage.getItem(getStorageKey("callingState"));
      if (saved) {
        const state = JSON.parse(saved);
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          setShowCallModal(state.showCallModal || false);
          setCallingStatus(state.callingStatus || "idle");
          setCurrentContactIndex(state.currentContactIndex || 0);
          // Convert timestamp strings back to Date objects in callResults
          const restoredCallResults = (state.callResults || []).map(
            (result) => ({
              ...result,
              timestamp: new Date(result.timestamp),
            })
          );
          setCallResults(restoredCallResults);
          // Restore connection status for call results
          if (state.callResultsConnectionStatus) {
            setCallResultsConnectionStatus(state.callResultsConnectionStatus);
          }
          setSelectedAgent(state.selectedAgent || null);
          // Mark that we restored from storage; used to gate auto-resume
          restoredFromStorageRef.current = true;
          return true;
        } else {
          // Clear old state
          localStorage.removeItem(getStorageKey("callingState"));
        }
      }
    } catch (error) {
      console.error("Error loading calling state:", error);
    }
    return false;
  };
  const clearCallingState = () => {
    localStorage.removeItem(getStorageKey("callingState"));
  };
  // Persist/restore the "ready for next run" UI flag so refresh keeps it
  const setReadyFlag = (value) => {
    setReadyForNextRun(value);
    try {
      if (value) {
        localStorage.setItem(getStorageKey("readyNextRun"), "1");
      } else {
        localStorage.removeItem(getStorageKey("readyNextRun"));
      }
    } catch (_) {}
  };
  useEffect(() => {
    try {
      const v = localStorage.getItem(getStorageKey("readyNextRun"));
      if (v === "1" && !campaign?.isRunning) {
        setReadyForNextRun(true);
      }
    } catch (_) {}
  }, [campaignId, campaign?.isRunning]);

  // Ensure UI is hydrated with latest merged calls (transcriptCount, groupSelections)
  // even when campaign is not running – do one initial fetch on mount / campaignId change.
  useEffect(() => {
    (async () => {
      try {
        await fetchApiMergedCalls(1, false, false);
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);
  const safeFormatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Error";
    }
  };
  // Compact date+time formatter for headers
  const formatDateTimeCompact = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      // Example: 06 Oct 2025, 14:35
      const d = date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const t = date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${d}, ${t}`;
    } catch {
      return "";
    }
  };
  // Function to check connection status for a specific call result
  const checkCallResultConnection = async (uniqueId, resultIndex) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE_URL}/logs?uniqueid=${uniqueId}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.logs && result.logs.length > 0) {
        // Found logs, mark as connected
        setCallResultsConnectionStatus((prev) => ({
          ...prev,
          [uniqueId]: "connected",
        }));
      } else {
        // No logs found, mark as not connected
        setCallResultsConnectionStatus((prev) => ({
          ...prev,
          [uniqueId]: "not_connected",
        }));
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      // On error, mark as not connected
      setCallResultsConnectionStatus((prev) => ({
        ...prev,
        [uniqueId]: "not_connected",
      }));
    }
  };
  const manualSaveState = () => {
    saveCallingState();
    const saveButton = document.querySelector(
      '[title="Manually save your calling progress"]'
    );
    if (saveButton) {
      const originalText = saveButton.innerHTML;
      saveButton.innerHTML = `
        <svg class="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Saved!
      `;
      saveButton.className =
        "inline-flex items-center px-4 py-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg transition-all duration-200";
      setTimeout(() => {
        saveButton.innerHTML = originalText;
        saveButton.className =
          "inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200";
      }, 2000);
    }
  };
  // Save state whenever calling-related states change
  useEffect(() => {
    if (campaignId) {
      saveCallingState();
      try {
        // Persist isRunning and currentRunId explicitly to survive navigation/back
        if (typeof campaign?.isRunning === "boolean") {
          localStorage.setItem(
            getStorageKey("isRunning"),
            campaign.isRunning ? "1" : "0"
          );
        }
        if (currentRunId) {
          localStorage.setItem(getStorageKey("currentRunId"), currentRunId);
        } else {
          localStorage.removeItem(getStorageKey("currentRunId"));
        }
      } catch (_) {}
    }
  }, [
    showCallModal,
    callingStatus,
    currentContactIndex,
    callResults,
    selectedAgent,
    callResultsConnectionStatus,
    campaignId,
    campaign?.isRunning,
    currentRunId,
  ]);
  // Save viewed transcripts whenever they change
  useEffect(() => {
    if (campaignId) {
      saveViewedTranscripts();
    }
  }, [viewedTranscripts, campaignId]);
  // Save filter states whenever they change
  useEffect(() => {
    if (campaignId) {
      saveFilterStates();
    }
  }, [flagFilter, callFilter, dispositionFilter, rowDisposition, campaignId]);
  // Removed scroll position preservation and scroll lock mechanisms
  // that were causing unwanted scroll jumps in campaign history section
  useEffect(() => {
    // Restore persisted state FIRST to avoid UI flicker
    try {
      const savedRunId = localStorage.getItem(getStorageKey("currentRunId"));
      const savedIsRunning = localStorage.getItem(getStorageKey("isRunning"));
      if (savedRunId) setCurrentRunId(savedRunId);
      if (savedIsRunning !== null) {
        setCampaign((prev) =>
          prev ? { ...prev, isRunning: savedIsRunning === "1" } : prev
        );
      }
      // Restore filter states
      loadFilterStates();
    } catch (_) {}
    // Then load fresh data from backend
    const loadData = async () => {
      try {
        await Promise.all([
          fetchCampaignDetails(),
          fetchAvailableGroups(),
          fetchAgents(),
          fetchClientData(),
          fetchCampaignGroups(),
          fetchCampaignHistory(campaignId),
          fetchCampaignCallingStatus()
        ]);
      } catch (error) {
        console.error("Error loading campaign data:", error);
        // Set loading to false even if there's an error
        setLoading(false);
      }
    };
    loadData();
  }, [campaignId]);
  // Auto-load agent configuration when campaign data is available
  useEffect(() => {
    if (campaign && campaign.agent) {
      const primaryAgentId = getPrimaryAgentId();
      if (primaryAgentId) {
        console.log(
          `🔧 CAMPAIGN: Auto-loading agent configuration for agent ${primaryAgentId}`
        );
        fetchAgentConfig(primaryAgentId);
        fetchAgentDispositions(primaryAgentId);
      } else {
        console.log(`🔧 CAMPAIGN: No agent assigned to campaign`);
        setAgentConfigMode("serial");
      }
    }
  }, [campaign]); // Trigger when campaign data changes
  // Defer heavy data fetching until the campaign is actually running (with debouncing)
  useEffect(() => {
    const isRunning =
      (campaign && campaign.isRunning) || callingStatus === "calling";
    if (!campaignId || !isRunning) return;
    // Debounce rapid state changes to prevent multiple API calls
    const timeoutId = setTimeout(() => {
      // Load merged calls from new API
      fetchApiMergedCalls(1);
      // Load viewed transcripts
      loadViewedTranscripts();
    }, 500); // 500ms debounce delay
    return () => clearTimeout(timeoutId);
  }, [campaign?.isRunning, callingStatus, campaignId]);
  // Refresh history when calling stops or completes so the last run appears
  useEffect(() => {
    if (!campaignId) return;
    if (callingStatus !== "calling") {
      fetchCampaignHistory(campaignId);
    }
  }, [callingStatus, campaignId]);
  // Fetch agent name when campaign loads
  useEffect(() => {
    const fetchAgentName = async () => {
      const agentId = getPrimaryAgentId();
      if (!agentId) return;
      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agentId}/name`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAgentMap({ [agentId]: data.data.name });
        }
      }
    };
    fetchAgentName();
  }, [campaign?.agent]);
  // Fetch campaign contacts when campaign data is available
  useEffect(() => {
    if (campaign?._id) {
      fetchCampaignContacts();
    }
  }, [campaign?._id]); // Only fetch when campaign ID changes, not when campaign object updates
  // Load calling state when campaign contacts are available
  // Guard: only restore from local storage if backend reports campaign is running.
  // This prevents showing "running" after a manual stop followed by a refresh.
  useEffect(() => {
    if (campaignContacts.length > 0 && campaignId && campaign?.isRunning) {
      const hasRestoredState = loadCallingState();
      // Do not show any popup/banners on load
    }
  }, [campaignContacts, campaignId, campaign?.isRunning]);
  // Auto-resume calling ONLY if restored from storage (not on manual start)
  useEffect(() => {
    if (
      restoredFromStorageRef.current &&
      callingStatus === "calling" &&
      campaignContacts.length > 0 &&
      selectedAgent &&
      !isStartingCall
    ) {
      const timer = setTimeout(() => {
        // Reset the flag so this runs only once after restore
        restoredFromStorageRef.current = false;
        // Do not show popup or auto-resume on load
        if (callingStatus === "calling") {
          setCallingStatus("idle");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [callingStatus, campaignContacts, selectedAgent, isStartingCall]);
  // Check connection status for call results after 40 seconds AND automatically update campaign status
  useEffect(() => {
    callResults.forEach((result, index) => {
      if (result.success && result.uniqueId) {
        // Set initial status as connected
        setCallResultsConnectionStatus((prev) => ({
          ...prev,
          [result.uniqueId]: "connected",
        }));
        // Check connection status after 40 seconds
        const timer = setTimeout(async () => {
          await checkCallResultConnection(result.uniqueId, index);
          // AUTOMATIC: Also update campaign status after checking connection
          if (campaign?._id) {
            console.log(
              `Automatically updating campaign status for ${result.uniqueId} after connection check...`
            );
            updateCallStatus(result.uniqueId);
          }
        }, 40000);
        // Cleanup timer on unmount
        return () => clearTimeout(timer);
      }
    });
  }, [callResults, campaign?._id]);
  // Debug: Monitor callResults changes to identify duplicates
  useEffect(() => {
    if (callResults.length > 0) {
      console.log("CallResults changed:", callResults.length, "results");
      // Check for duplicates
      const contactCounts = {};
      callResults.forEach((result) => {
        const contactKey = `${result.contact.phone}-${result.contact.name}`;
        contactCounts[contactKey] = (contactCounts[contactKey] || 0) + 1;
      });
      const duplicates = Object.entries(contactCounts).filter(
        ([key, count]) => count > 1
      );
      if (duplicates.length > 0) {
        console.warn("Duplicate call results detected:", duplicates);
        duplicates.forEach(([contactKey, count]) => {
          console.warn(`Contact ${contactKey} has ${count} call results`);
        });
      }
    }
  }, [callResults]);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCallModal && !event.target.closest(".call-modal")) {
        setShowCallModal(false);
      }
      if (showAddGroupsModal && !event.target.closest(".add-groups-modal")) {
        handleCloseAddGroupsModal();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCallModal, showAddGroupsModal]);
  const fetchClientData = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(`${API_BASE}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.success) {
        setClientData(result.data);
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
    }
  };
  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(`${API_BASE}/agents`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.success) {
        setAgents(result.data || []);
      } else {
        console.error("Failed to fetch agents:", result.error);
        setAgents([]);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };
  // Fetch agent configuration to determine calling mode
  const fetchAgentConfig = async (agentId) => {
    try {
      setAgentConfigLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(`${API_BASE}/agent-config/${agentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch agent configuration");
      }
      const data = await response.json();
      console.log(
        `🔧 CAMPAIGN: Agent config API response for ${agentId}:`,
        data
      );
      if (data.success && data.data) {
        const mode = data.data.mode || "serial";
        setAgentConfigMode(mode);
        console.log(
          `🔧 CAMPAIGN: Agent ${agentId} configured for ${mode} mode`
        );
        return mode;
      }
    } catch (error) {
      console.error("Error fetching agent configuration:", error);
      setAgentConfigMode("serial"); // Default to serial on error
    } finally {
      setAgentConfigLoading(false);
    }
    return "serial";
  };
  // Fetch agent dispositions separately
  const fetchAgentDispositions = async (agentId) => {
    if (!agentId) {
      setAgentDispositions([]);
      return;
    }
    try {
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(`${API_BASE}/../dispositions/agent/${agentId}/dispositions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch agent dispositions");
      }
      const data = await response.json();
      console.log(
        `🔧 CAMPAIGN: Agent dispositions API response for ${agentId}:`,
        data
      );
      if (data.success && data.data) {
        const dispositions = data.data.dispositions || [];
        setAgentDispositions(dispositions);
        console.log(
          `🔧 CAMPAIGN: Agent ${agentId} has ${dispositions.length} dispositions:`,
          dispositions
        );
        console.log(
          `🔧 CAMPAIGN: Disposition structure:`,
          dispositions.map(d => ({ title: d.title, subCount: d.sub?.length || 0 }))
        );
      } else {
        setAgentDispositions([]);
      }
    } catch (error) {
      console.error("Error fetching agent dispositions:", error);
      setAgentDispositions([]); // Reset dispositions on error
    }
  };
  // Resolve agent name by id using cached list or fetch single agent
  const getAgentNameById = async (agentId) => {
    if (!agentId) return "";
    // Try local cache map
    if (agentMap[agentId]) {
      return agentMap[agentId];
    }
    // Try existing agents list
    const found = (agents || []).find((a) => a._id === agentId);
    if (found) {
      const name =
        found.name ||
        found.fullName ||
        found.email ||
        String(agentId).slice(0, 6);
      setAgentMap((m) => ({ ...m, [agentId]: name }));
      return name;
    }
    // Fetch single agent from lightweight API
    try {
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(`${API_BASE}/agents/${agentId}/name`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await resp.json();
      if (resp.ok && result?.data) {
        const name = result.data.name || String(agentId).slice(0, 6);
        setAgentMap((m) => ({ ...m, [agentId]: name }));
        return name;
      }
    } catch (e) {
      console.error("Failed to fetch agent by id", e);
    }
    // Fallback: try public agent endpoint without client scoping
    try {
      const resp2 = await fetch(`${API_BASE}/agents/${agentId}/public`);
      const result2 = await resp2.json();
      if (resp2.ok && result2?.data) {
        const agent = result2.data;
        const name =
          agent.name ||
          agent.fullName ||
          agent.agentName ||
          agent.email ||
          String(agentId).slice(0, 6);
        setAgentMap((m) => ({ ...m, [agentId]: name }));
        return name;
      }
    } catch (e) {
      console.error("Failed to fetch public agent by id", e);
    }
    return String(agentId).slice(0, 6);
  };
  const makeVoiceBotCall = async (contact, agent) => {
    // Ensure uniqueId is always defined, even if an error occurs before API calls
    const uniqueId = `aidial-${Date.now()}-${performance
      .now()
      .toString(36)
      .replace(".", "")}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      // Get client API key from database
      const token = sessionStorage.getItem("clienttoken");
      const apiKeysResponse = await fetch(`${API_BASE}/api-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const apiKeysResult = await apiKeysResponse.json();
      let apiKey = "629lXqsiDk85lfMub7RsN73u4741MlOl4Dv8kJE9"; // fallback
      if (apiKeysResult.success && apiKeysResult.data.length > 0) {
        // Use the first available API key or find a specific one
        apiKey = apiKeysResult.data[0].key;
      }
      // Ensure name is properly handled - if no name, send empty string
      // Use empty string when name is missing or number-like to avoid polluting name fields with phone
      const rawName = getContactName(contact);
      const digitsOnly = (s) => (s || "").replace(/\D/g, "");
      const isNumberLike =
        rawName &&
        digitsOnly(rawName).length >= 6 &&
        !isNaN(Number(digitsOnly(rawName)));
      const sameAsPhone =
        rawName && digitsOnly(rawName) === digitsOnly(contact.phone || "");
      const contactName =
        rawName && !isNumberLike && !sameAsPhone ? rawName : "";
      const callPayload = {
        transaction_id: "CTI_BOT_DIAL",
        phone_num: contact.phone.replace(/[^\d]/g, ""), // Remove non-digits
        uniqueid: uniqueId,
        callerid: "168353225",
        uuid: clientData?.clientId || "client-uuid-001",
        custom_param: {
          uniqueid: uniqueId,
          contact_name: contactName || "", // Add contact name to custom params if needed
        },
        resFormat: 3,
      };
      // Use your backend proxy instead of direct API call
      const response = await fetch(`${API_BASE}/proxy/clicktobot`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey, payload: callPayload }),
      });
      const result = await response.json();
      // If call is successful, store the unique ID in the campaign
      if (result.success && campaign?._id) {
        try {
          await fetch(`${API_BASE}/campaigns/${campaign._id}/unique-ids`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uniqueId,
              contactId: contact._id || null,
              runId: currentRunId || null,
            }),
          });
        } catch (error) {
          console.error("Failed to store unique ID in campaign:", error);
          // Don't fail the call if this fails
        }
      }
      return {
        success: result.success,
        data: result.data,
        contact,
        timestamp: new Date(),
        uniqueId,
      };
    } catch (error) {
      console.error("Error making voice bot call:", error);
      return {
        success: false,
        error: error.message,
        contact,
        timestamp: new Date(),
        uniqueId,
      };
    }
  };
  const startCalling = async () => {
    // Prevent multiple simultaneous calls
    if (callingStatus === "calling" || isStartingCall) {
      console.log(
        "Calling already in progress or starting, ignoring duplicate start request"
      );
      return;
    }
    // Check if campaign has groups
    if (!campaignGroups || campaignGroups.length === 0) {
      toast.error(
        "Cannot start calling: No groups assigned. Please add groups first."
      );
      return;
    }
    // Check if campaign has an agent
    if (!selectedAgent) {
      toast.error(
        "Cannot start calling: No agent selected. Please select an agent first."
      );
      return;
    }
    // Check if campaign has contacts
    if (!campaignContacts || campaignContacts.length === 0) {
      toast.error(
        "Cannot start calling: No contacts available. Please sync contacts from groups first."
      );
      return;
    }
    setIsStartingCall(true);
    console.log("Starting calling process...");
    console.log("Current callResults before starting:", callResults);
    setCallingStatus("calling");
    setCurrentContactIndex(0);
    // Don't clear existing results - keep them to prevent duplicates
    // setCallResults([]); // Removed this line to prevent duplicate calls
    // Track contacts that have been called in this session
    const calledContacts = new Set();
    // Remove duplicates from campaignContacts to prevent duplicate calls
    const uniqueContacts = campaignContacts.filter(
      (contact, index, self) =>
        index ===
        self.findIndex(
          (c) => c.phone === contact.phone && c.name === contact.name
        )
    );
    console.log(
      `Original contacts: ${campaignContacts.length}, Unique contacts: ${uniqueContacts.length}`
    );
    for (let contactIdx = 0; contactIdx < uniqueContacts.length; contactIdx++) {
      if (callingStatus === "paused") {
        break;
      }
      setCurrentContactIndex(contactIdx);
      const contact = uniqueContacts[contactIdx];
      // Create a unique key for this contact
      const rawName2 = getContactName(contact);
      const isNumberLike2 =
        rawName2 &&
        digitsOnly(rawName2).length >= 6 &&
        !isNaN(Number(digitsOnly(rawName2)));
      const sameAsPhone2 =
        rawName2 && digitsOnly(rawName2) === digitsOnly(contact.phone || "");
      const contactName =
        rawName2 && !isNumberLike2 && !sameAsPhone2 ? rawName2 : "";
      const contactKey = `${contact.phone}-${contactName}`;
      // Check if this contact was already called in this session or in previous results
      const alreadyCalledInSession = calledContacts.has(contactKey);
      const alreadyCalledInResults = callResults.some(
        (r) =>
          r.contact.phone === contact.phone &&
          getContactName(r.contact) === contactName
      );
      // Additional check: if the same contact was called very recently (within 30 seconds), skip it
      const recentCall = callResults.find(
        (r) =>
          r.contact.phone === contact.phone &&
          getContactName(r.contact) === contactName &&
          r.timestamp &&
          Date.now() - new Date(r.timestamp).getTime() < 30000 // 30 seconds
      );
      if (alreadyCalledInSession || alreadyCalledInResults || recentCall) {
        console.log(
          `Contact ${getContactDisplayName(contact)} (${
            contact.phone
          }) already called or called recently, skipping...`
        );
        continue;
      }
      console.log(
        `Calling ${getContactDisplayName(contact)} at ${
          contact.phone
        } from campaign contacts...`
      );
      // Mark this contact as called
      calledContacts.add(contactKey);
      console.log(
        `Making voice bot call to ${getContactDisplayName(contact)} (${
          contact.phone
        })...`
      );
      const result = await makeVoiceBotCall(contact, selectedAgent);
      console.log(`Call result for ${getContactDisplayName(contact)}:`, result);
      // Add the call result
      setCallResults((prev) => {
        console.log(
          `Adding new call result for ${contact.name}. Previous count: ${prev.length}`
        );
        return [...prev, result];
      });
      if (contactIdx < uniqueContacts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      // Additional safeguard: wait 1 second after each call to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("Calling process completed. Final callResults:", callResults);
    // AUTOMATIC: Update all call statuses when calling process completes
    if (campaign?._id) {
      console.log(
        "Calling process completed, automatically updating all call statuses..."
      );
      callResults.forEach((result) => {
        if (result.uniqueId) {
          updateCallStatus(result.uniqueId);
        }
      });
    }
    setCallingStatus("completed");
    setIsStartingCall(false);
  };
  const pauseCalling = () => {
    setCallingStatus("paused");
    console.log("Calling paused - state will persist across page reloads");
  };
  const resumeCalling = async () => {
    if (!campaignGroups || campaignGroups.length === 0) {
      toast.error(
        "Cannot resume calling: No groups assigned. Please add groups first."
      );
      return;
    }
    if (!selectedAgent) {
      toast.error(
        "Cannot resume calling: No agent selected. Please select an agent first."
      );
      return;
    }
    if (!campaignContacts || campaignContacts.length === 0) {
      toast.error(
        "Cannot resume calling: No contacts available. Please sync contacts from groups first."
      );
      return;
    }
    setCallingStatus("calling");
    const calledContacts = new Set();
    for (
      let contactIdx = currentContactIndex;
      contactIdx < campaignContacts.length;
      contactIdx++
    ) {
      if (callingStatus === "paused") {
        break;
      }
      setCurrentContactIndex(contactIdx);
      const contact = campaignContacts[contactIdx];
      // Create a unique key for this contact
      const contactName = getContactName(contact);
      const contactKey = `${contact.phone}-${contactName}`;
      // Check if this contact was already called in this session or in previous results
      const alreadyCalledInSession = calledContacts.has(contactKey);
      const alreadyCalledInResults = callResults.some(
        (r) =>
          r.contact.phone === contact.phone &&
          getContactName(r.contact) === contactName
      );
      // Additional check: if the same contact was called very recently (within 30 seconds), skip it
      const recentCall = callResults.find(
        (r) =>
          r.contact.phone === contact.phone &&
          getContactName(r.contact) === contactName &&
          r.timestamp &&
          Date.now() - new Date(r.timestamp).getTime() < 30000 // 30 seconds
      );
      if (alreadyCalledInSession || alreadyCalledInResults || recentCall) {
        console.log(
          `Contact ${getContactDisplayName(contact)} (${
            contact.phone
          }) already called or called recently, skipping...`
        );
        continue;
      }
      console.log(
        `Calling ${getContactDisplayName(contact)} at ${
          contact.phone
        } from campaign contacts...`
      );
      // Mark this contact as called
      calledContacts.add(contactKey);
      const result = await makeVoiceBotCall(contact, selectedAgent);
      setCallResults((prev) => [...prev, result]);
      if (contactIdx < campaignContacts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      // Additional safeguard: wait 1 second after each call to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setCallingStatus("completed");
  };
  const skipToNext = () => {
    if (currentContactIndex < campaignContacts.length - 1) {
      setCurrentContactIndex((prev) => prev + 1);
    }
  };
  const resetCalling = () => {
    setCallingStatus("idle");
    setCurrentContactIndex(0);
    setCallResults([]);
    setCallResultsConnectionStatus({}); // Clear connection status
    clearCallingState(); // Clear saved state when resetting
    console.log("Calling reset - all progress cleared");
  };
  // Function to remove duplicate call results
  const removeDuplicateCallResults = () => {
    setCallResults((prev) => {
      const uniqueResults = [];
      const seenContacts = new Set();
      prev.forEach((result) => {
        const contactName = getContactName(result.contact);
        const contactKey = `${result.contact.phone}-${contactName}`;
        if (!seenContacts.has(contactKey)) {
          seenContacts.add(contactKey);
          uniqueResults.push(result);
        } else {
          console.log(
            `Removing duplicate call result for ${getContactDisplayName(
              result.contact
            )}`
          );
        }
      });
      console.log(
        `Cleaned up call results: ${prev.length} -> ${uniqueResults.length}`
      );
      return uniqueResults;
    });
  };
  // Function to update call status based on isActive from external service
  const updateCallStatus = async (uniqueId) => {
    try {
      if (!campaign?._id) return;
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/call-status/${uniqueId}/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        console.log(`Call status updated for ${uniqueId}:`, result.data);
        // Refresh campaign data to get updated status
        fetchCampaignDetails();
      }
    } catch (error) {
      console.error("Error updating call status:", error);
    }
  };
  // Get current progress
  const getProgress = () => {
    const totalContacts = campaignContacts.length;
    const completedContacts = currentContactIndex;
    // If we're at the last contact, mark as fully completed
    if (currentContactIndex >= totalContacts) {
      return { completed: totalContacts, total: totalContacts };
    }
    return { completed: completedContacts, total: totalContacts };
  };
  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        const next = result.data;
        // Merge with any persisted isRunning to avoid immediate flip on mount
        try {
          const savedIsRunning = localStorage.getItem(
            getStorageKey("isRunning")
          );
          if (savedIsRunning !== null && typeof next?.isRunning !== "boolean") {
            next.isRunning = savedIsRunning === "1";
          }
        } catch (_) {}
        setCampaign(next);
        try {
          const savedRunId = localStorage.getItem(
            getStorageKey("currentRunId")
          );
          const savedIsRunning = localStorage.getItem(
            getStorageKey("isRunning")
          );
          if (savedRunId && !currentRunId) setCurrentRunId(savedRunId);
          if (typeof next?.isRunning === "boolean") {
            localStorage.setItem(
              getStorageKey("isRunning"),
              next.isRunning ? "1" : "0"
            );
          } else if (savedIsRunning !== null) {
            setCampaign((prev) =>
              prev ? { ...prev, isRunning: savedIsRunning === "1" } : prev
            );
          }
        } catch (_) {}
        // Remove this call to prevent re-rendering issues
        // fetchCampaignGroups();
      } else {
        console.error("Failed to fetch campaign details:", result.error);
        throw new Error(result.error || "Failed to fetch campaign details");
      }
    } catch (error) {
      console.error("Error fetching campaign details:", error);
      // For demo purposes, create a dummy campaign if API fails
      setCampaign({
        _id: campaignId,
        name: "Demo Campaign",
        description: "This is a demo campaign for testing purposes",
        groupIds: [],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "draft",
        createdAt: new Date(),
      });
    } finally {
      // Only update loading state if component is still mounted
      setLoading(false);
    }
  };
  // Reset all runtime lists/UI to be ready for a fresh run
  const resetSectionForNextRun = () => {
    setCallingStatus("idle");
    setCurrentContactIndex(0);
    setCallResults([]);
    setCallResultsConnectionStatus({});
    setApiMergedCalls([]);
    setApiMergedCallsTotals({
      totalItems: 0,
      totalConnected: 0,
      totalMissed: 0,
      totalDuration: 0,
      totalOngoing: 0,
      totalRinging: 0,
    });
    setApiMergedCallsPage(1);
    setApiMergedCallsTotalPages(0);
    setApiMergedCallsTotalItems(0);
    setCallDetails([]);
    setCallDetailsMeta({ totalPages: 0, totalLogs: 0 });
    // Clear transcript and live-call UI state
    setTranscriptCounts(new Map());
    setTranscriptContent("");
    setShowTranscriptModal(false);
    setSelectedCall(null);
    setTranscriptDocId(null);
    setLiveTranscript("");
    setLiveTranscriptLines([]);
    stopLiveCallPolling();
    // Clear any persisted calling state for a fresh start
    clearCallingState();
    setReadyFlag(true);
  };
  const fetchAvailableGroups = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(`${API_BASE}/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.success) {
        setAvailableGroups(result.data);
      } else {
        console.error("Failed to fetch groups:", result.error);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };
  const fetchCampaignGroups = async () => {
    try {
      setLoadingCampaignGroups(true);
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        setCampaignGroups([]);
        return;
      }
      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setCampaignGroups(result.data || []);
      } else {
        console.error("Failed to fetch campaign groups:", result.error);
        setCampaignGroups([]);
      }
    } catch (error) {
      console.error("Error fetching campaign groups:", error);
      setCampaignGroups([]);
    } finally {
      setLoadingCampaignGroups(false);
    }
  };
  const openGroupRangeModal = async (groupId) => {
    try {
      setRangeModalLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(`${API_BASE}/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await resp.json();
      if (result.success && result.data) {
        const grp = result.data;
        setRangeModalGroup(grp);
        const total = Array.isArray(grp.contacts) ? grp.contacts.length : 0;
        setRangeStartIndex(1);
        setRangeEndIndex(total);
        setSelectedContactIndices(Array.from({ length: total }, (_, i) => i));
        setShowGroupRangeModal(true);
      } else {
        toast.warn(`Failed to load group: ${result.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Failed to load group:", e);
      toast.error("Error loading group");
    } finally {
      setRangeModalLoading(false);
    }
  };
  const saveGroupRangeToCampaign = async () => {
    try {
      if (!campaign?._id || !rangeModalGroup?._id) return;
      const token = sessionStorage.getItem("clienttoken");
      // Build payload based on active tab
      let body = { replace: true };
      if (groupModalTab === "select") {
        if (
          !Array.isArray(selectedContactIndices) ||
          selectedContactIndices.length === 0
        ) {
          toast.warn("Select at least one contact to save.");
          return;
        }
        body.selectedIndices = selectedContactIndices;
      } else {
        // Convert 1-based UI to 0-based backend; end is exclusive already
        const startParsed = Number(rangeStartIndex);
        const endParsed = Number(rangeEndIndex);
        if (!Number.isFinite(startParsed) || !Number.isFinite(endParsed)) {
          toast.warn("Please enter both start and end indices.");
          return;
        }
        if (startParsed < 1) {
          toast.warn("Start index must be at least 1.");
          return;
        }
        if (endParsed <= startParsed) {
          toast.warn("End (exclusive) must be greater than start.");
          return;
        }
        body.startIndex = Math.max(0, startParsed - 1);
        body.endIndex = Math.max(0, endParsed);
      }
      if (currentRunId) body.runId = currentRunId;
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/groups/${rangeModalGroup._id}/contacts-range`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      const result = await resp.json();
      if (result.success) {
        toast.success(
          `Added ${result.data.added} of ${result.data.totalSelected} contacts from range ${body.startIndex + 1}-${body.endIndex}`
        );
        // Also sync campaign.groupSelections if backend returned it
        if (result?.data?.groupSelections && Array.isArray(result.data.groupSelections)) {
          setCampaign((prev) => prev ? { ...prev, groupSelections: result.data.groupSelections } : { groupSelections: result.data.groupSelections });
        }
        setSelectedRangesDisplay((prev) => ([
          ...prev,
          {
            groupId: String(rangeModalGroup._id),
            groupName: rangeModalGroup.name || "",
            start: body.startIndex + 1,
            end: body.endIndex,
            selectedAt: Date.now(),
          },
        ]));
        setShowGroupRangeModal(false);
        setRangeModalGroup(null);
        await fetchCampaignContacts();
      } else {
        toast.warn(
          `Failed to add contacts: ${result.error || "Unknown error"}`
        );
      }
    } catch (e) {
      console.error("Failed to add contacts by range:", e);
      toast.error("Error adding contacts by range");
    }
  };
  // Fetch campaign call logs
  const fetchCampaignCallLogs = async (page = 1) => {
    try {
      if (!campaign?._id) return;
      // Only fetch when campaign is running
      const running =
        (campaign && campaign.isRunning) || callingStatus === "calling";
      // Always allow a fetch on demand to hydrate UI (ranges, transcript counts),
      // regardless of running state. Live auto-refresh can still be gated elsewhere.
      setCallDetailsLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(callDetailsLimit),
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      // If the backend provided a runId for this session, filter logs to that run
      if (currentRunId) {
        params.set("runId", String(currentRunId));
      }
      const resp = await fetch(
        `${API_BASE}/campaigns/${
          campaign._id
        }/call-logs-dashboard?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        throw new Error(result.error || "Failed to fetch call logs");
      }
      // Only update state if there are actual changes
      const newCallDetails = result.data || [];
      const newCallDetailsMeta = result.pagination || {
        totalPages: 0,
        totalLogs: 0,
      };
      // Check if call details data has changed
      const callDetailsChanged =
        JSON.stringify(newCallDetails) !== JSON.stringify(callDetails);
      // Check if call details meta has changed
      const callDetailsMetaChanged =
        JSON.stringify(newCallDetailsMeta) !== JSON.stringify(callDetailsMeta);
      // Check if page has changed
      const callDetailsPageChanged = page !== callDetailsPage;
      // Only update state if there are changes
      if (callDetailsChanged) {
        setCallDetails(newCallDetails);
      }
      if (callDetailsMetaChanged) {
        setCallDetailsMeta(newCallDetailsMeta);
      }
      if (callDetailsPageChanged) {
        setCallDetailsPage(page);
      }
      console.log("Campaign Call Logs API Response:", {
        changesDetected: {
          callDetailsChanged,
          callDetailsMetaChanged,
          callDetailsPageChanged,
        },
      });
    } catch (e) {
      console.error("Error fetching campaign call logs:", e);
      setCallDetails([]);
      setCallDetailsMeta({ totalPages: 0, totalLogs: 0 });
    } finally {
      setCallDetailsLoading(false);
    }
  };
  // Fetch merged calls from new API
  // Helper to build a stable key for deduping loaded leads
  const getLeadKey = (lead) =>
    lead?.documentId ||
    lead?.contactId ||
    `${lead?.number || ""}-${lead?.time || ""}`;
  const fetchApiMergedCalls = async (
    page = 1,
    isAutoRefresh = false,
    append = false
  ) => {
    try {
      if (!campaignId) return;
      // Only fetch when campaign is running
      const running =
        (campaign && campaign.isRunning) || callingStatus === "calling";
      if (!running) {
        return;
      }
      // Only show loading spinner on initial load, not on auto-refresh
      if (!isAutoRefresh) {
        if (append) {
          setApiMergedCallsLoadingMore(true);
        } else {
          setApiMergedCallsLoading(true);
        }
      }
      // Clamp requested page to valid lower bound; upper bound handled after fetch when totalPages is known
      const requestedPage = Math.max(1, Number(page) || 1);
      const token = sessionStorage.getItem("clienttoken");
      const params = new URLSearchParams({
        page: String(requestedPage),
        limit: String(50),
      });
      if (currentRunId) {
        params.set("runId", String(currentRunId));
      }
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaignId}/merged-calls?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        throw new Error(result.error || "Failed to fetch merged calls");
      }
      // Only update state if there are actual changes
      const newData = result.data || [];
      const newCampaignMeta = result.campaign || {};
      const newTotals = result.totals || {
        totalItems: 0,
        totalConnected: 0,
        totalMissed: 0,
        totalDuration: 0,
      };
      const newPage = result.pagination?.currentPage || requestedPage;
      const newTotalPages = result.pagination?.totalPages || 0;
      const newTotalItems = result.pagination?.totalItems || 0;
      // Compute updated list (append or replace)
      let updatedList = apiMergedCalls;
      if (append && newPage > apiMergedCallsPage) {
        const existingKeys = new Set((apiMergedCalls || []).map(getLeadKey));
        const filteredToAppend = newData.filter(
          (item) => !existingKeys.has(getLeadKey(item))
        );
        updatedList = [...apiMergedCalls, ...filteredToAppend];
      } else {
        updatedList = newData;
      }
      // Check if call logs data has changed
      const callLogsChanged =
        JSON.stringify(updatedList) !== JSON.stringify(apiMergedCalls);
      // Check if totals have changed
      const totalsChanged =
        JSON.stringify(newTotals) !== JSON.stringify(apiMergedCallsTotals);
      // Check if pagination has changed
      const paginationChanged =
        newPage !== apiMergedCallsPage ||
        newTotalPages !== apiMergedCallsTotalPages ||
        newTotalItems !== apiMergedCallsTotalItems;
      // Only update state if there are changes
      if (callLogsChanged) {
        setApiMergedCalls(updatedList);
      }
      if (totalsChanged) {
        setApiMergedCallsTotals(newTotals);
      }
      if (paginationChanged) {
        setApiMergedCallsPage(newPage);
        setApiMergedCallsTotalPages(newTotalPages);
        setApiMergedCallsTotalItems(newTotalItems);
      }
      // Update campaign meta (e.g., groupSelections) if provided
      try {
        if (newCampaignMeta && Array.isArray(newCampaignMeta.groupSelections)) {
          setCampaign((prev) => prev ? { ...prev, groupSelections: newCampaignMeta.groupSelections } : { groupSelections: newCampaignMeta.groupSelections });
        }
      } catch (_) {}

      // Mark initial load as complete
      if (apiMergedCallsInitialLoad) {
        setApiMergedCallsInitialLoad(false);
      }
      console.log("Merged Calls API Response:", {
        data: result.data,
        pagination: result.pagination,
        campaign: result.campaign,
        totals: result.totals,
        changesDetected: {
          callLogsChanged,
          totalsChanged,
          paginationChanged,
        },
      });
    } catch (e) {
      console.error("Error fetching API merged calls:", e);
      setApiMergedCalls([]);
      setApiMergedCallsPage(1);
      setApiMergedCallsTotalPages(0);
      setApiMergedCallsTotalItems(0);
      setApiMergedCallsTotals({
        totalItems: 0,
        totalConnected: 0,
        totalMissed: 0,
        totalDuration: 0,
        totalOngoing: 0,
        totalRinging: 0,
      });
      setApiMergedCallsInitialLoad(false);
    } finally {
      setApiMergedCallsLoading(false);
      setApiMergedCallsLoadingMore(false);
    }
  };
  // Open transcript modal and fetch transcript by documentId
  const openTranscript = async (documentId, leadData = null) => {
    try {
      if (!campaignId || !documentId) return;
      setTranscriptDocId(documentId);
      setTranscriptContent("");
      setTranscriptLoading(true);
      setShowTranscriptModal(true);
      // Mark this transcript as viewed
      setViewedTranscripts((prev) => new Set([...prev, documentId]));
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaignId}/logs/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        throw new Error(result.error || "Failed to fetch transcript");
      }
      const fetchedTranscript = result.transcript || "";
      setTranscriptContent(fetchedTranscript);
      // Cache message count for this document to display near Transcript button
      const docKey = documentId;
      if (docKey && fetchedTranscript) {
        const msgCount = countMessagesInTranscript(fetchedTranscript);
        setTranscriptCounts((prev) => {
          const next = new Map(prev);
          next.set(docKey, msgCount);
          return next;
        });
      }
      // Store lead data for display in modal
      if (leadData) {
        setSelectedCall(leadData);
      }
    } catch (e) {
      console.error("Error fetching transcript:", e);
      setTranscriptContent("");
    } finally {
      setTranscriptLoading(false);
    }
  };
  // Parse transcript content into chat-like format
  const parseTranscriptToChat = (transcriptText) => {
    if (!transcriptText) return [];
    const lines = transcriptText.split("\n").filter((line) => line.trim());
    const messages = [];
    let lastMessage = null;
    for (const line of lines) {
      const timestampMatch = line.match(/\[([^\]]+)\]/);
      let timestamp = null;
      if (timestampMatch) {
        try {
          const date = new Date(timestampMatch[1]);
          if (!isNaN(date.getTime())) {
            timestamp = date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            });
          }
        } catch (error) {
          console.error("Error parsing timestamp:", error);
        }
      }
      const lineWithoutTimestamp = line.replace(/\[[^\]]+\]\s*/, "");
      const colonIndex = lineWithoutTimestamp.indexOf(":");
      if (colonIndex !== -1) {
        const speaker = lineWithoutTimestamp.substring(0, colonIndex).trim();
        const text = lineWithoutTimestamp.substring(colonIndex + 1).trim();
        const isAI =
          speaker.toLowerCase().includes("ai") ||
          speaker.toLowerCase().includes("agent");
        const isUser =
          speaker.toLowerCase().includes("user") ||
          speaker.toLowerCase().includes("customer");
        // Always create a new message entry, even if the speaker is the same
        messages.push({ speaker, text, timestamp, isAI, isUser });
        lastMessage = messages[messages.length - 1];
      } else if (lastMessage) {
        // No explicit speaker: treat as continuation of the last message only
        lastMessage.text += " " + lineWithoutTimestamp.trim();
      }
    }
    return messages;
  };
  // Ensure jsPDF is available via CDN (lightweight, no build dependency)
  const ensureJsPDFLoaded = async () => {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    await new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-jspdf]");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      s.async = true;
      s.setAttribute("data-jspdf", "1");
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.body.appendChild(s);
    });
    return window.jspdf.jsPDF;
  };
  // Ensure html2canvas is available via CDN for Unicode-friendly rendering
  const ensureHtml2CanvasLoaded = async () => {
    if (window.html2canvas) return window.html2canvas;
    await new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-html2canvas]");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.src =
        "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      s.async = true;
      s.setAttribute("data-html2canvas", "1");
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.body.appendChild(s);
    });
    return window.html2canvas;
  };
  // Utility to load an image and return DataURL
  const loadImageAsDataURL = (src) =>
    new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = src;
      } catch (e) {
        reject(e);
      }
    });
  // Ensure pdf-lib is available for client-side PDF merging
  const ensurePdfLibLoaded = async () => {
    if (window.PDFLib && window.PDFLib.PDFDocument) return window.PDFLib;
    await new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-pdflib]");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
      s.async = true;
      s.setAttribute("data-pdflib", "1");
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.body.appendChild(s);
    });
    return window.PDFLib;
  };
  // Build a single transcript PDF for a given contact row and return ArrayBuffer
  const generateTranscriptPdfForDocument = async (row) => {
    const JsPDFCtor = await ensureJsPDFLoaded();
    await ensureHtml2CanvasLoaded();
    const doc = new JsPDFCtor({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 40;
    const marginTop = 60;
    const lineGap = 18;
    // Header/logo
    try {
      const logoDataUrl = await loadImageAsDataURL("/AitotaLogo.png");
      const logoW = 50;
      const logoH = 50;
      doc.addImage(
        logoDataUrl,
        "PNG",
        pageWidth - marginX - logoW,
        30,
        logoW,
        logoH
      );
    } catch {}
    // Title (match single transcript style)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text("Call Transcript", marginX, marginTop - 20);
    // Contact details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const y0 = marginTop;
    const contactName = row.name || "-";
    const phone = row.number || row.phone || "-";
    const dateStr = row.time
      ? new Date(row.time).toLocaleString()
      : (row.timestamp && new Date(row.timestamp).toLocaleString()) || "-";
    const durationStr =
      typeof row.duration === "number"
        ? formatDuration(row.duration)
        : row.duration || "0:00";
    const details = [
      `Name: ${contactName}`,
      `Mobile: ${phone}`,
      `Date & Time: ${dateStr}`,
      `Duration: ${durationStr}`,
    ];
    let yy = y0;
    for (const d of details) {
      doc.text(d, marginX, yy);
      yy += lineGap;
    }
    // Divider and section heading
    yy += 8;
    doc.setDrawColor(220);
    doc.line(marginX, yy, pageWidth - marginX, yy);
    yy += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Conversation", marginX, yy);
    yy += 12;
    // Fetch transcript text
    let transcriptText = "";
    try {
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaignId}/logs/${row.documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await resp.json();
      transcriptText = result?.transcript || result?.transcriptText || "";
    } catch {}
    // Render transcript as chat bubbles (match single-download implementation) and snapshot per page via html2canvas
    try {
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
        if (msg.isAI) {
          wrapper.style.justifyContent = "flex-start";
        } else if (msg.isUser) {
          wrapper.style.justifyContent = "flex-end";
        } else {
          wrapper.style.justifyContent = "center";
        }
        const bubble = document.createElement("div");
        bubble.style.maxWidth = "72%";
        bubble.style.borderRadius = "10px";
        bubble.style.padding = "8px 10px";
        bubble.style.boxSizing = "border-box";
        bubble.style.whiteSpace = "pre-wrap";
        bubble.style.wordBreak = "normal";
        bubble.style.overflowWrap = "break-word";
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
        tsSpan.textContent = msg.timestamp ? msg.timestamp : "";
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
      const imgWidth = pageWidth - marginX * 2;
      const containerWidthPx = 560;
      const pageHeightPt = doc.internal.pageSize.getHeight();
      const bottomMargin = 40;
      const scale = 1.25;
      const calcMaxContentPx = (availablePt) =>
        Math.floor((availablePt * containerWidthPx) / imgWidth);
      let pageDiv = document.createElement("div");
      pageDiv.style.width = "100%";
      pageDiv.style.boxSizing = "border-box";
      container.appendChild(pageDiv);
      const renderCurrentPage = async (cursorYForPage) => {
        const canvas = await window.html2canvas(pageDiv, {
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
        pageHeightPt - yy - 10 - bottomMargin
      );
      const nextPagesMaxPx = calcMaxContentPx(pageHeightPt - 60 - bottomMargin);
      let isFirstPage = true;
      const chatMessages = parseTranscriptToChat(transcriptText || "");
      for (let i = 0; i < chatMessages.length; i++) {
        const node = createBubbleNode(chatMessages[i]);
        pageDiv.appendChild(node);
        const maxPx = isFirstPage ? firstPageMaxPx : nextPagesMaxPx;
        if (pageDiv.scrollHeight > maxPx && pageDiv.childElementCount > 1) {
          pageDiv.removeChild(node);
          await renderCurrentPage(isFirstPage ? yy + 10 : 60);
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
        await renderCurrentPage(isFirstPage ? yy + 10 : 60);
      }
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      // Footer
      try {
        const footer = "Powered by AItota";
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        const footerY = doc.internal.pageSize.getHeight() - 30;
        doc.text(footer, pageWidth - marginX - doc.getTextWidth(footer), footerY);
      } catch {}
    } catch {}
    // Return as ArrayBuffer for merging
    const arrayBuffer = doc.output("arraybuffer");
    return arrayBuffer;
  };
  const handleDownloadTranscriptPDF = async () => {
    try {
      setIsDownloadingPdf(true);
      if (!selectedCall) return;
      const [jsPDFCtor, html2canvas] = await Promise.all([
        ensureJsPDFLoaded(),
        ensureHtml2CanvasLoaded(),
      ]);
      const doc = new jsPDFCtor({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 40;
      const lineHeight = 16;
      let cursorY = 60;
      // Header branding
      try {
        const logoUrl = "/AitotaLogo.png";
        const dataUrl = await loadImageAsDataURL(logoUrl);
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
      } catch (_) {
        // ignore logo load failure
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Call Transcript", marginX, cursorY);
      cursorY += 26;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const contactName = getContactDisplayNameBlank(selectedCall) || "-";
      const phone = selectedCall.number || selectedCall.phone || "-";
      const dateStr = selectedCall.time
        ? new Date(selectedCall.time).toLocaleString()
        : (selectedCall.timestamp &&
            new Date(selectedCall.timestamp).toLocaleString()) ||
          "-";
      const durationStr = formatDuration(selectedCall.duration || 0);
      const metaLines = [
        `Name: ${contactName}`,
        `Mobile: ${phone}`,
        `Date & Time: ${dateStr}`,
        `Duration: ${durationStr}`,
      ];
      metaLines.forEach((l) => {
        doc.text(l, marginX, cursorY);
        cursorY += 16;
      });
      cursorY += 8;
      doc.setDrawColor(220);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 20;
      // Chat content header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Conversation", marginX, cursorY);
      cursorY += 12;
      // Render conversation as HTML to preserve Unicode, then rasterize via html2canvas
      const chatMessages = transcriptContent
        ? parseTranscriptToChat(transcriptContent)
        : [];
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.width = "560px"; // narrower to reduce raster size
      container.style.padding = "6px"; // tighter padding
      container.style.background = "#ffffff";
      container.style.color = "#111827";
      container.style.fontFamily =
        'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Noto Sans", "Noto Sans Devanagari", sans-serif';
      container.style.fontSize = "12px";
      container.style.lineHeight = "1.4";
      document.body.appendChild(container);
      // Build bubbles into page-sized chunks and render per page (fast and avoids mid-bubble cut)
      const createBubbleNode = (msg) => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.marginBottom = "6px";
        wrapper.style.width = "100%";
        wrapper.style.boxSizing = "border-box";
        if (msg.isAI) {
          wrapper.style.justifyContent = "flex-start";
        } else if (msg.isUser) {
          wrapper.style.justifyContent = "flex-end";
        } else {
          wrapper.style.justifyContent = "center";
        }
        const bubble = document.createElement("div");
        bubble.style.maxWidth = "72%";
        bubble.style.borderRadius = "10px";
        bubble.style.padding = "8px 10px";
        bubble.style.boxSizing = "border-box";
        bubble.style.whiteSpace = "pre-wrap";
        bubble.style.wordBreak = "normal";
        bubble.style.overflowWrap = "break-word";
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
        tsSpan.textContent = msg.timestamp ? msg.timestamp : "";
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
      const imgWidth = pageWidth - marginX * 2;
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
          // Move last node to next page
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
      // Render remaining items in the last page
      if (pageDiv.childElementCount > 0) {
        await renderCurrentPage(isFirstPage ? cursorY : 60);
      }
      // remove offscreen container after rendering
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      // Footer branding
      const footer = "Powered by AItota";
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      const footerY = doc.internal.pageSize.getHeight() - 30;
      doc.text(footer, pageWidth - marginX - doc.getTextWidth(footer), footerY);
      const safeName = (contactName || "transcript")
        .toString()
        .replace(/[^a-z0-9_-]+/gi, "_");
      const fileName = `AItota_Transcript_${safeName}_${(phone || "").replace(
        /\D/g,
        ""
      )}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error("Failed to generate transcript PDF", e);
      alert("Unable to download PDF right now. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };
  // Download transcript as TXT
  const handleDownloadTranscriptTXT = async () => {
    try {
      if (!selectedCall) return;
      const content = transcriptContent || "";
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcript_${
        selectedCall.documentId || selectedCall.uniqueId || Date.now()
      }.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("TXT download failed:", e);
      try {
        toast.error("Failed to download TXT");
      } catch {}
    }
  };
  // Count grouped conversation messages (user+AI) in a transcript
  const countMessagesInTranscript = (transcriptText) => {
    if (!transcriptText) return 0;
    const lines = transcriptText.split("\n").filter((line) => line.trim());
    let lastSpeaker = null;
    let count = 0;
    for (const line of lines) {
      const lineWithoutTimestamp = line.replace(/\[[^\]]+\]\s*/, "");
      const colonIndex = lineWithoutTimestamp.indexOf(":");
      if (colonIndex !== -1) {
        const speaker = lineWithoutTimestamp.substring(0, colonIndex).trim();
        if (speaker && speaker !== lastSpeaker) {
          count += 1;
          lastSpeaker = speaker;
        }
      }
    }
    return count;
  };
  // Get cached count or compute and cache per lead/document
  const getTranscriptMessageCount = (lead) => {
    if (!lead) return 0;
    const key = lead.documentId || getLeadKey(lead);
    const cached = transcriptCounts.get(key);
    if (typeof cached === "number") return cached;
    const text = lead.transcript || "";
    if (!text) return 0;
    const count = countMessagesInTranscript(text);
    setTranscriptCounts((prev) => {
      const next = new Map(prev);
      next.set(key, count);
      return next;
    });
    return count;
  };
  // Open transcript intelligently: if call is ongoing and we have uniqueId, show live logs; else load saved transcript
  const openTranscriptSmart = async (lead) => {
    try {
      const status = (lead.status || lead.leadStatus || "").toLowerCase();
      const uniqueId =
        lead.uniqueId || lead.metadata?.customParams?.uniqueid || null;
      if (status === "ongoing" && uniqueId) {
        setShowCallModal(true);
        // Seed selected call context for details panel
        setSelectedCall(
          lead.metadata ? { ...lead, metadata: lead.metadata } : { ...lead }
        );
        await startLiveCallPolling(uniqueId);
        return;
      }
      if (lead.documentId) {
        // Mark this transcript as viewed
        setViewedTranscripts((prev) => new Set([...prev, lead.documentId]));
        await openTranscript(lead.documentId, lead);
      } else {
        // Open modal even when there's no document so user gets feedback
        setSelectedCall(lead);
        setTranscriptDocId(null);
        setTranscriptContent("");
        setShowTranscriptModal(true);
      }
    } catch (e) {
      console.error("Failed to open transcript smartly:", e);
    }
  };
  // Fetch campaign calling status and progress
  const fetchCampaignCallingStatus = async () => {
    try {
      if (!campaignId) return;
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/calling-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Update campaign running status from backend
          const nextIsRunning = result.data.isRunning;
          const backendAllFinalized = !!result?.data?.allCallsFinalized;
          const isActuallyRunning = !!result?.data?.isActuallyRunning;
          // Auto-save history when backend indicates calling has become inactive
          try {
            const wasRunning = campaign?.isRunning;
            const effectiveRunId = currentRunId || result?.data?.latestRunId;
            // More robust completion detection
            const shouldAutoSave = (
              // Campaign was running and now stopped
              (wasRunning && !nextIsRunning) ||
              // All calls are finalized (regardless of isRunning state)
              backendAllFinalized ||
              // Campaign is not actually running despite being marked as running
              (!isActuallyRunning && wasRunning)
            ) && effectiveRunId && !autoSavingRef.current && lastSavedRunIdRef.current !== effectiveRunId;
            if (shouldAutoSave) {
              console.log(`💾 FRONTEND: Auto-saving campaign run ${effectiveRunId}`);
              autoSavingRef.current = true;
              const endTime = new Date();
              const inferredStart = result?.data?.runStartTime
                ? new Date(result.data.runStartTime)
                : null;
              const startTime = campaignStartTime || inferredStart || endTime;
              const runTime = calculateRunTime(startTime, endTime);
              const callLogs = await fetchCurrentRunCallLogs(effectiveRunId);
              await saveCampaignRun(
                campaignId,
                formatTime(startTime),
                formatTime(endTime),
                runTime,
                callLogs,
                effectiveRunId
              );
              lastSavedRunIdRef.current = effectiveRunId;
              try {
                sessionStorage.setItem(
                  `campaign_${campaignId}_lastSavedRunId`,
                  String(effectiveRunId)
                );
              } catch (_) {}
              // Reset run tracking and UI state for next run
              setCurrentRunId(null);
              setCampaignStartTime(null);
              resetSectionForNextRun();
              setReadyFlag(true);
              stopLiveCallPolling();
              // Refresh campaign history to show the new entry
              await fetchCampaignHistory(campaignId);
            }
          } catch (e) {
            console.error("Auto-save on inactive failed:", e);
          } finally {
            autoSavingRef.current = false;
          }
          // Update campaign state if it changed
          if (nextIsRunning !== campaign?.isRunning) {
            setCampaign((prev) =>
              prev ? { ...prev, isRunning: nextIsRunning } : null
            );
            // Broadcast status change to other tabs
            const channel = new BroadcastChannel(`campaign-status-${campaignId}`);
            channel.postMessage({
              type: 'campaign-status-update',
              isRunning: nextIsRunning,
              runId: currentRunId,
              timestamp: Date.now()
            });
            channel.close();
          }
          // Update calling status based on backend data
          if (result.data.progress) {
            const progress = result.data.progress;
            if (progress.totalContacts > 0) {
              // Calculate percentage and update calling status
              const completedPercentage =
                (progress.completedCalls / progress.totalContacts) * 100;
              if (completedPercentage === 100) {
                setCallingStatus("completed");
              } else if (progress.isRunning) {
                setCallingStatus("calling");
              } else if (progress.isPaused) {
                setCallingStatus("paused");
              }
              // Update current contact index if available
              if (progress.currentContactIndex !== undefined) {
                setCurrentContactIndex(progress.currentContactIndex);
              }
            }
          }
          // Update last updated timestamp
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error("Error fetching campaign calling status:", error);
    }
  };
  // Cross-tab communication for campaign status updates
  useEffect(() => {
    if (!campaignId) return;
    const channel = new BroadcastChannel(`campaign-status-${campaignId}`);
    const handleMessage = (event) => {
      if (event.data.type === 'campaign-status-update') {
        const { isRunning, runId, timestamp } = event.data;
        // Update campaign status if it's different
        if (campaign?.isRunning !== isRunning) {
          setCampaign((prev) => prev ? { ...prev, isRunning } : prev);
          // Update runId if provided
          if (runId && runId !== currentRunId) {
            setCurrentRunId(runId);
          }
          // Show notification for status changes from other tabs
          if (isRunning) {
            toast.info("Campaign started", { autoClose: 3000 });
          } else {
            toast.info("Campaign stopped", { autoClose: 3000 });
          }
        }
      }
    };
    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [campaignId, campaign?.isRunning, currentRunId]);
  // Enhanced polling with immediate refresh on tab visibility
  useEffect(() => {
    if (!campaignId || isSeriesMode) return;
    let intervalId = null;
    let visibilityIntervalId = null;
    const poll = () => {
        fetchCampaignCallingStatus();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Immediate refresh when tab becomes visible
        poll();
        // Also broadcast current status to other tabs
        if (campaign?.isRunning !== undefined) {
          const channel = new BroadcastChannel(`campaign-status-${campaignId}`);
          channel.postMessage({
            type: 'campaign-status-update',
            isRunning: campaign.isRunning,
            runId: currentRunId,
            timestamp: Date.now()
          });
          channel.close();
        }
      }
    };
    // Initial call
    poll();
    // Set up polling based on campaign status
    if (campaign?.isRunning) {
      // More frequent polling when campaign is running (every 2 seconds)
      intervalId = setInterval(poll, 2000);
    } else {
      // Less frequent polling when campaign is idle (every 10 seconds)
      intervalId = setInterval(poll, 10000);
    }
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (visibilityIntervalId) clearInterval(visibilityIntervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [campaignId, campaign?.isRunning, isSeriesMode, currentRunId]);
  // Universal calling function that handles all calling scenarios
  // Helper function to generate consistent runIds
  const generateRunId = (context = "fallback") => {
    const runId = `run_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    console.warn(`⚠️ Generated fallback runId for ${context}: ${runId}`);
    return runId;
  };
  // Helper function to validate and ensure runId is present
  const ensureRunId = (providedRunId, context = "call") => {
    if (
      providedRunId &&
      providedRunId !== undefined &&
      providedRunId !== null
    ) {
      return providedRunId;
    }
    // Try to use current runId
    if (currentRunId && currentRunId !== undefined && currentRunId !== null) {
      return currentRunId;
    }
    // Generate fallback runId
    return generateRunId(context);
  };
  const universalCalling = async (options = {}) => {
    const {
      type = "single", // 'single', 'missed', 'selected', 'campaign'
      contacts = [], // Array of contact objects for selected calls
      lead = null, // Single lead object for single calls
      agentId = null, // Specific agent ID (optional)
      delayBetweenCalls = 2000, // Delay between calls for bulk operations
      runId = undefined, // Run ID for tracking; if undefined and newInstance we will create a fresh one
      newInstance = true, // Always start a fresh run instance for single/missed/selected by default
      onSuccess = null, // Success callback
      onError = null, // Error callback
      showToast = true, // Whether to show toast messages
    } = options;
    try {
      // Common validation checks
      if (!campaignGroups || campaignGroups.length === 0) {
        const errorMsg =
          "Cannot make calls: No groups assigned. Please add groups first.";
        if (showToast) toast.error(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return { success: false, error: errorMsg };
      }
      // Resolve agent ID
      let resolvedAgentId = agentId;
      if (!resolvedAgentId) {
        const primaryAgentId = getPrimaryAgentId();
        resolvedAgentId =
          (selectedAgent && (selectedAgent._id || selectedAgent)) ||
          primaryAgentId ||
          (Array.isArray(agents) &&
            agents[0] &&
            (agents[0]._id || agents[0].id));
      }
      if (!resolvedAgentId) {
        const errorMsg =
          "Cannot make calls: No agent available. Please add/select an agent first.";
        if (showToast) toast.error(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return { success: false, error: errorMsg };
      }
      // Check if campaign has contacts (for bulk operations)
      if (
        (type === "missed" || type === "selected" || type === "campaign") &&
        (!campaignContacts || campaignContacts.length === 0)
      ) {
        const errorMsg =
          "Cannot make calls: No contacts available. Please sync contacts from groups first.";
        if (showToast) toast.error(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return { success: false, error: errorMsg };
      }
      if (!campaignId) {
        const errorMsg = "Campaign ID not found";
        if (showToast) toast.error(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return { success: false, error: errorMsg };
      }
      const token = sessionStorage.getItem("clienttoken");
      // CRITICAL: Validate and ensure runId is always present before making calls
      let effectiveRunId = runId;
      // For single/missed/selected calls, ensure we have a valid runId
      if (type === "single" || type === "missed" || type === "selected") {
        // If no runId provided and newInstance is true, create a new run
        if (
          (!effectiveRunId ||
            effectiveRunId === undefined ||
            effectiveRunId === null) &&
          newInstance
        ) {
          // Create a new run instance first - will be handled below
        } else if (
          !effectiveRunId ||
          effectiveRunId === undefined ||
          effectiveRunId === null
        ) {
          // Use helper function to ensure we have a valid runId
          effectiveRunId = ensureRunId(effectiveRunId, `${type} call`);
        }
      }
      // For campaign calls, runId should come from the start-calling response
      if (type === "campaign") {
        // Campaign calls will get runId from backend response
        effectiveRunId = null; // Will be set after start-calling response
      }
      // Final validation: ensure we have a valid runId for all call types except campaign
      if (
        type !== "campaign" &&
        (!effectiveRunId ||
          effectiveRunId === undefined ||
          effectiveRunId === null)
      ) {
        const errorMsg = `Cannot make ${type} calls: No valid runId available. Please ensure campaign is properly initialized.`;
        console.error(errorMsg);
        if (showToast) toast.error(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return { success: false, error: errorMsg };
      }
      // Decide effective run id. For single/missed/selected, we FIRST ask backend to start a run
      // so that a campaign details document is created and subsequent merge/logs can attach.
      if (
        (type === "single" || type === "missed" || type === "selected") &&
        newInstance
      ) {
        try {
          const respStart = await fetch(
            `${API_BASE}/campaigns/${campaignId}/start-calling`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                agentId: resolvedAgentId,
                delayBetweenCalls: delayBetweenCalls,
              }),
            }
          );
          if (respStart.status === 402) {
            setShowCreditsModal(true);
            return { success: false, error: "Insufficient credits" };
          }
          const startResult = await respStart.json();
          if (!respStart.ok || startResult.success === false) {
            throw new Error(
              startResult.error || "Failed to start campaign run"
            );
          }
          effectiveRunId =
            startResult?.data?.runId ||
            `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setCurrentRunId(effectiveRunId);
          setCampaignStartTime(new Date());
          setCampaign((prev) => (prev ? { ...prev, isRunning: true } : prev));
          setReadyFlag(false);
          // Proactive short burst refresh to ensure new run logs appear quickly
          const refreshBurst = () => {
            try {
              fetchCampaignCallLogs(1);
              fetchApiMergedCalls(1);
            } catch (_) {}
          };
          setTimeout(refreshBurst, 600);
          setTimeout(refreshBurst, 2000);
          setTimeout(refreshBurst, 5000);
        } catch (e) {
          console.error("Failed to ensure backend run instance:", e);
          return { success: false, error: e.message || "Failed to start run" };
        }
      }
      let response, result;
      // Handle different calling types
      switch (type) {
        case "single":
          if (!lead) {
            const errorMsg = "Lead object is required for single calls";
            if (showToast) toast.error(errorMsg);
            if (onError) onError(new Error(errorMsg));
            return { success: false, error: errorMsg };
          }
          const phone = (lead.number || "").toString().trim();
          if (!phone) {
            const errorMsg = "Phone number is required";
            if (showToast) toast.error(errorMsg);
            if (onError) onError(new Error(errorMsg));
            return { success: false, error: errorMsg };
          }
          // Find the agent object to get callerId
          const primaryAgent = (agents || []).find(
            (a) => a._id === resolvedAgentId
          );
          // Generate uniqueId for the call
          const uniqueId = `aidial-${Date.now()}-${performance
            .now()
            .toString(36)
            .replace(".", "")}-${Math.random().toString(36).substr(2, 9)}`;
          // Optimistic UI: mark this row as redialing
          setRedialingCalls(
            (prev) => new Set([...prev, lead.documentId || lead.contactId])
          );
          response = await fetch(`${API_BASE}/calls/single`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              appid: 2,
              contact: phone,
              caller_id: primaryAgent?.callerId,
              agentId: resolvedAgentId,
              custom_field: {
                name: getContactName(lead) || "",
                uniqueId: uniqueId,
                runId: ensureRunId(effectiveRunId, "single call"),
              },
            }),
          });
          if (response.status === 402) {
            setShowCreditsModal(true);
            return { success: false, error: "Insufficient credits" };
          }
          result = await response.json();
          if (!response.ok || result.success === false) {
            throw new Error(result.error || "Failed to initiate call");
          }
          if (showToast)
            toast.success(`Calling to ${phone} started successfully`);
          console.log("Single call initiated:", result.data?.uniqueId);
          // Mark UI as calling for visibility in dashboards
          setCallingStatus("calling");
          // Register uniqueId to campaign run for log aggregation
          try {
            const uid = result?.data?.uniqueId;
            if (uid && campaign?._id) {
              await fetch(`${API_BASE}/campaigns/${campaign._id}/unique-ids`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  uniqueId: uid,
                  contactId: lead._id || null,
                  runId: ensureRunId(
                    effectiveRunId,
                    "single call uniqueId registration"
                  ),
                }),
              });
            }
          } catch (_) {}
          // Clean up redialing state after delay
          setTimeout(() => {
            setRedialingCalls((prev) => {
              const newSet = new Set(prev);
              newSet.delete(lead.documentId || lead.contactId);
              return newSet;
            });
            fetchCampaignCallLogs(1);
            fetchApiMergedCalls(1);
          }, 1500);
          break;
        case "missed":
          response = await fetch(
            `${API_BASE}/campaigns/${campaignId}/call-missed`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                agentId: resolvedAgentId,
                delayBetweenCalls: delayBetweenCalls,
                runId: effectiveRunId || currentRunId || undefined,
              }),
            }
          );
          result = await response.json();
          if (!response.ok || result.success === false) {
            throw new Error(
              result.error || "Failed to trigger missed-calls dialing"
            );
          }
          setCallingStatus("calling");
          if (showToast)
            toast.warn(
              `Calling ${result.count || 0} not connected contact(s) has started.`
            );
          // Kick a status refresh shortly after
          setTimeout(() => {
            fetchCampaignCallingStatus();
            fetchApiMergedCalls(1);
          }, 3000);
          break;
        case "selected":
          if (!contacts || contacts.length === 0) {
            const errorMsg = "No contacts selected for calling";
            if (showToast) toast.error(errorMsg);
            if (onError) onError(new Error(errorMsg));
            return { success: false, error: errorMsg };
          }
          // For selected calls, we'll make individual API calls for each contact
          // This could be optimized with a bulk endpoint if available
          const selectedCalls = contacts.map(async (contact) => {
            const phone = (contact.number || contact.phone || "")
              .toString()
              .trim();
            if (!phone) return null;
            const primaryAgent = (agents || []).find(
              (a) => a._id === resolvedAgentId
            );
            const uniqueId = `aidial-${Date.now()}-${performance
              .now()
              .toString(36)
              .replace(".", "")}-${Math.random().toString(36).substr(2, 9)}`;
            try {
              const resp = await fetch(`${API_BASE}/calls/single`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  appid: 2,
                  contact: phone,
                  caller_id: primaryAgent?.callerId,
                  agentId: resolvedAgentId,
                  custom_field: {
                    name: getContactName(contact) || "",
                    uniqueId: uniqueId,
                    runId: ensureRunId(effectiveRunId, "missed call"),
                  },
                }),
              });
              if (resp.status === 402) {
                setShowCreditsModal(true);
                return { success: false, error: "Insufficient credits" };
              }
              const res = await resp.json();
              // Register uniqueId for each initiated call
              try {
                const uid = res?.data?.uniqueId;
                if (resp.ok && res.success && uid && campaign?._id) {
                  await fetch(
                    `${API_BASE}/campaigns/${campaign._id}/unique-ids`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        uniqueId: uid,
                        contactId: contact._id || null,
                        runId: ensureRunId(
                          effectiveRunId,
                          "missed call uniqueId registration"
                        ),
                      }),
                    }
                  );
                }
              } catch (_) {}
              return { success: resp.ok && res.success, contact, result: res };
            } catch (error) {
              return { success: false, contact, error: error.message };
            }
          });
          const results = await Promise.all(selectedCalls);
          const successful = results.filter((r) => r && r.success).length;
          const failed = results.filter((r) => r && !r.success).length;
          if (showToast) {
            if (successful > 0)
              toast.success(`Successfully initiated ${successful} call(s)`);
            if (failed > 0) toast.warn(`Failed to initiate ${failed} call(s)`);
          }
          // Ensure UI shows as calling for this run
          setCallingStatus("calling");
          // Refresh data after calls
          setTimeout(() => {
            fetchCampaignCallLogs(1);
            fetchApiMergedCalls(1);
          }, 1500);
          break;
        case "campaign":
          response = await fetch(
            `${API_BASE}/campaigns/${campaignId}/start-calling`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                agentId: resolvedAgentId,
                delayBetweenCalls: delayBetweenCalls,
              }),
            }
          );
          result = await response.json();
          if (response.status === 402) {
            setShowCreditsModal(true);
            return { success: false, error: "Insufficient credits" };
          }
          if (!response.ok || result.success === false) {
            throw new Error(result.error || "Failed to start campaign calling");
          }
          // Capture runId from backend and start local tracking
          try {
            const newRunId = result?.data?.runId;
            if (newRunId) {
              setCurrentRunId(newRunId);
              setCampaignStartTime(new Date());
            }
          } catch (_) {}
          setCampaign((prev) => (prev ? { ...prev, isRunning: true } : prev));
          setLastUpdated(new Date());
          if (showToast) toast.success("Campaign calling started successfully");
          break;
        default:
          const errorMsg = `Unknown calling type: ${type}`;
          if (showToast) toast.error(errorMsg);
          if (onError) onError(new Error(errorMsg));
          return { success: false, error: errorMsg };
      }
      // Call success callback if provided
      if (onSuccess) onSuccess(result);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Universal calling failed (${type}):`, error);
      const errorMsg = error.message || `Failed to initiate ${type} calling`;
      if (showToast) toast.warn(errorMsg);
      if (onError) onError(error);
      // Clean up redialing state on error for single calls
      if (type === "single" && lead) {
        setRedialingCalls((prev) => {
          const newSet = new Set(prev);
          newSet.delete(lead.documentId || lead.contactId);
          return newSet;
        });
      }
      return { success: false, error: errorMsg };
    }
  };
  // Call again via backend: dial missed contacts server-side
  const callMissedCalls = async () => {
    await universalCalling({
      type: "missed",
      delayBetweenCalls: 2000,
      runId: undefined,
      newInstance: true,
    });
  };
  // Select and call functionality
  const handleSelectContact = (contact) => {
    const contactId = contact.documentId || contact.contactId || contact._id;
    setSelectedContacts((prev) => {
      if (
        prev.some((c) => (c.documentId || c.contactId || c._id) === contactId)
      ) {
        return prev.filter(
          (c) => (c.documentId || c.contactId || c._id) !== contactId
        );
      } else {
        return [...prev, contact];
      }
    });
  };
  const handleSelectAllContacts = () => {
    if (selectAllContacts) {
      setSelectedContacts([]);
      setSelectAllContacts(false);
    } else {
      setSelectedContacts([...campaignContacts]);
      setSelectAllContacts(true);
    }
  };
  const callSelectedContacts = async () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select contacts to call");
      return;
    }
    await universalCalling({
      type: "selected",
      contacts: selectedContacts,
      runId: undefined,
      newInstance: true,
    });
    // Clear selection after calling
    setSelectedContacts([]);
    setSelectAllContacts(false);
  };
  const isContactSelected = (contact) => {
    const contactId = contact.documentId || contact.contactId || contact._id;
    return selectedContacts.some(
      (c) => (c.documentId || c.contactId || c._id) === contactId
    );
  };
  // Select and call functionality for call logs
  const handleSelectCallLog = (callLog) => {
    const callLogId =
      callLog.documentId ||
      callLog.contactId ||
      getLeadKey(callLog) ||
      callLog._id;
    setSelectedCallLogs((prev) => {
      if (
        prev.some(
          (c) =>
            (c.documentId || c.contactId || getLeadKey(c) || c._id) ===
            callLogId
        )
      ) {
        return prev.filter(
          (c) =>
            (c.documentId || c.contactId || getLeadKey(c) || c._id) !==
            callLogId
        );
      } else {
        return [...prev, callLog];
      }
    });
  };
  const handleSelectAllCallLogs = () => {
    if (selectAllCallLogs) {
      setSelectedCallLogs([]);
      setSelectAllCallLogs(false);
    } else {
      // Get filtered call logs (same logic as the table)
      const filteredCallLogs = apiMergedCalls.filter((lead) => {
        const name = (lead.name || "").toString().trim();
        const number = (lead.number || "").toString().trim();
        const hasRealName = name && name !== "-";
        const hasRealNumber = number && number !== "-" && /\d/.test(number);
        const byData = hasRealName || hasRealNumber;
        const status = (lead.status || "").toLowerCase();
        const connectedStatuses = ["connected", "completed", "ongoing"];
        const missedStatuses = ["missed", "not_connected", "failed"];
        const byStatus =
          callFilter === "all"
            ? true
            : callFilter === "connected"
            ? connectedStatuses.includes(status)
            : missedStatuses.includes(status);
        // Flag filter
        const rowId = `${lead.runInstanceNumber || lead.runId || lead.index}-${
          lead.documentId || lead.contactId || lead.idx
        }`;
        const selectedFlag = rowDisposition[rowId];
        const byFlag =
          flagFilter === "all"
            ? true
            : flagFilter === "unlabeled"
            ? !selectedFlag
            : selectedFlag === flagFilter;
        // Disposition filter
        const leadDisposition = (
          lead.leadStatus || lead.disposition || ""
        ).toLowerCase();
        const byDisposition =
          dispositionFilter === "all"
            ? true
            : leadDisposition === dispositionFilter;
        return byData && byStatus && byFlag && byDisposition;
      });
      setSelectedCallLogs([...filteredCallLogs]);
      setSelectAllCallLogs(true);
    }
  };
  const callSelectedCallLogs = async () => {
    if (selectedCallLogs.length === 0) {
      toast.error("Please select call logs to call");
      return;
    }
    await universalCalling({
      type: "selected",
      contacts: selectedCallLogs,
      runId: undefined,
      newInstance: true,
    });
    // Clear selection after calling
    setSelectedCallLogs([]);
    setSelectAllCallLogs(false);
  };
  const isCallLogSelected = (callLog) => {
    const callLogId =
      callLog.documentId ||
      callLog.contactId ||
      getLeadKey(callLog) ||
      callLog._id;
    return selectedCallLogs.some(
      (c) =>
        (c.documentId || c.contactId || getLeadKey(c) || c._id) === callLogId
    );
  };
  // Retry a single lead (row) via backend single-call API
  const handleRetryLead = async (lead) => {
    await universalCalling({
      type: "single",
      lead: lead,
      runId: undefined,
      newInstance: true,
    });
  };
  // Campaign contacts management functions
  const fetchCampaignContacts = async () => {
    try {
      if (!campaign?._id) return;
      setLoadingContacts(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/contacts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        setCampaignContacts(result.data || []);
      } else {
        console.error("Failed to fetch campaign contacts:", result.error);
        setCampaignContacts([]);
      }
    } catch (error) {
      console.error("Error fetching campaign contacts:", error);
      setCampaignContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };
  const syncContactsFromGroups = async (silent = false) => {
    try {
      if (!campaign?._id) return;
      setLoadingContacts(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/sync-contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        if (!silent) {
          toast.warn(
            `Successfully synced ${result.data.totalContacts} contacts from ${result.data.totalGroups} groups`
          );
        }
        fetchCampaignContacts(); // Refresh the contacts list
      } else {
        // If backend reports no groups, treat it as success after last-group deletion
        if (result.error === "No groups in campaign to sync from") {
          await fetchCampaignContacts();
          if (!silent) {
            toast.warn(
              "Contacts cleared because no groups remain in the campaign."
            );
          }
        } else if (!silent) {
          toast.warn("Failed to sync contacts: " + result.error);
        }
      }
    } catch (error) {
      console.error("Error syncing contacts:", error);
      if (!silent) {
        toast.warn("Error syncing contacts: " + error.message);
      }
    } finally {
      setLoadingContacts(false);
    }
  };
  const addContactToCampaign = async () => {
    try {
      if (!campaign?._id || !contactForm.phone) {
        toast.warn("Phone number is required");
        return;
      }
      // Name is optional, but if provided, it should be trimmed
      const contactData = {
        name: getContactName(contactForm),
        phone: contactForm.phone.trim(),
        email:
          contactForm.email && contactForm.email.trim()
            ? contactForm.email.trim()
            : "",
      };
      setLoadingContacts(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contactData),
        }
      );
      const result = await response.json();
      if (result.success) {
        toast.success("Contact added successfully");
        setContactForm({
          name: "",
          phone: "",
          email: "",
        });
        setShowAddContactModal(false);
        fetchCampaignContacts(); // Refresh the contacts list
      } else {
        toast.error("Failed to add contact: " + result.error);
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Error adding contact: " + error.message);
    } finally {
      setLoadingContacts(false);
    }
  };
  const removeContactFromCampaign = async (contactId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this contact from the campaign?"
      )
    ) {
      return;
    }
    try {
      if (!campaign?._id) return;
      setLoadingContacts(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/contacts/${contactId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        toast.success("Contact removed successfully");
        fetchCampaignContacts(); // Refresh the contacts list
      } else {
        toast.error("Failed to remove contact: " + result.error);
      }
    } catch (error) {
      console.error("Error removing contact:", error);
      toast.error("Error removing contact: " + error.message);
    } finally {
      setLoadingContacts(false);
    }
  };
  const handleCloseAddGroupsModal = () => {
    setShowAddGroupsModal(false);
    // Clear selected groups that are not in the campaign
    const currentSelected = selectedGroups.filter((id) =>
      campaignGroups.some((cg) => cg._id === id)
    );
    setSelectedGroups(currentSelected);
  };
  const getAvailableGroupsForCampaign = () => {
    // Get groups that are not already in the campaign
    const campaignGroupIds = campaignGroups.map((group) => group._id);
    return availableGroups.filter(
      (group) => !campaignGroupIds.includes(group._id)
    );
  };
  const handleAddSpecificGroupsToCampaign = async (groupIdsToAdd) => {
    if (groupIdsToAdd.length === 0) {
      toast.warn("Please select at least one group to add to the campaign.");
      return;
    }
    try {
      setAddingGroups(true);
      const token = sessionStorage.getItem("clienttoken");
      // Get current campaign groups and add new ones
      const currentGroupIds = campaignGroups.map((group) => group._id);
      const updatedGroupIds = [...currentGroupIds, ...groupIdsToAdd];
      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/groups`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupIds: updatedGroupIds,
          }),
        }
      );
      const result = await response.json();
      if (result.success) {
        // Update the campaign with new groups
        setCampaign((prev) => ({
          ...prev,
          groupIds: updatedGroupIds,
        }));
        // Refresh campaign groups to show the updated list
        fetchCampaignGroups();
        // Auto-sync contacts after adding groups (silent)
        await syncContactsFromGroups(true);
        setShowAddGroupsModal(false);
        toast.success("Groups added to campaign successfully!");
      } else {
        console.error("Failed to add groups to campaign:", result.error);
        toast.warn("Failed to add groups: " + result.error);
      }
    } catch (error) {
      console.error("Error adding groups to campaign:", error);
      toast.error("Error adding groups to campaign: " + error.message);
    } finally {
      setAddingGroups(false);
    }
  };
  const handleAddGroupsToCampaign = async () => {
    if (selectedGroups.length === 0) {
      toast.warn("Please select at least one group to add to the campaign.");
      return;
    }
    try {
      setAddingGroups(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/groups`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupIds: selectedGroups,
          }),
        }
      );
      const result = await response.json();
      if (result.success) {
        // Update the campaign with new groups
        setCampaign((prev) => ({
          ...prev,
          groupIds: selectedGroups,
        }));
        // Refresh campaign groups to show the updated list
        fetchCampaignGroups();
        // Auto-sync contacts after updating groups (silent)
        await syncContactsFromGroups(true);
        toast.success("Groups updated successfully!");
      } else {
        console.error("Failed to add groups to campaign:", result.error);
        toast.error("Failed to update groups: " + result.error);
      }
    } catch (error) {
      console.error("Error adding groups to campaign:", error);
      // For demo purposes, update locally if API fails
      setCampaign((prev) => ({
        ...prev,
        groupIds: selectedGroups,
      }));
      alert("Groups updated (demo mode)!");
    } finally {
      setAddingGroups(false);
    }
  };
  const handleRemoveGroup = async (groupId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this group from the campaign?"
      )
    ) {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("clienttoken");
        const response = await fetch(
          `${API_BASE}/campaigns/${campaignId}/groups/${groupId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const result = await response.json();
        if (result.success) {
          const updatedGroups = campaignGroups.filter(
            (group) => group._id !== groupId
          );
          setCampaign((prev) => ({
            ...prev,
            groupIds: updatedGroups.map((group) => group._id),
          }));
          setCampaignGroups(updatedGroups);
          setSelectedGroups((prev) => prev.filter((id) => id !== groupId));
          // Auto-sync contacts after removing a group (silent). Always run to clear stale contacts when no groups remain
          await syncContactsFromGroups(true);
        } else {
          console.error("Failed to remove group:", result.error);
          toast.warn("Failed to remove group: " + result.error);
        }
      } catch (error) {
        console.error("Error removing group:", error);
        // For demo purposes, remove locally if API fails
        const updatedGroups = campaignGroups.filter(
          (group) => group._id !== groupId
        );
        setCampaign((prev) => ({
          ...prev,
          groupIds: updatedGroups.map((group) => group._id),
        }));
      } finally {
        setLoading(false);
      }
    }
  };
  // Assign agent to campaign (PUT)
  const saveSelectedAgentToCampaign = async () => {
    try {
      if (!campaign?._id || !selectedAgentIdForAssign) return;
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(`${API_BASE}/campaigns/${campaign._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agent: [selectedAgentIdForAssign] }),
      });
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        toast.error(result.error || "Failed to assign agent");
        return;
      }
      setCampaign(result.data);
      // Fetch agent configuration when agent is assigned
      await fetchAgentConfig(selectedAgentIdForAssign);
      await fetchAgentDispositions(selectedAgentIdForAssign);
      // Optimistically set agent name so UI updates immediately without refresh
      try {
        const picked = (agents || []).find(
          (a) => a._id === selectedAgentIdForAssign
        );
        if (picked) {
          const displayName =
            picked.agentName ||
            picked.name ||
            picked.fullName ||
            picked.email ||
            "";
          if (displayName) {
            setAgentMap((m) => ({
              ...m,
              [selectedAgentIdForAssign]: displayName,
            }));
          }
        } else {
          // Fallback: fetch name via helper
          getAgentNameById(selectedAgentIdForAssign).then((nm) => {
            if (nm) {
              setAgentMap((m) => ({ ...m, [selectedAgentIdForAssign]: nm }));
            }
          });
        }
      } catch (_) {}
      setShowAddAgentModal(false);
      setSelectedAgentIdForAssign("");
      toast.success("Agent assigned successfully");
    } catch (e) {
      console.error("Assign agent failed:", e);
      toast.error("Failed to assign agent");
    }
  };
  // Backend start/stop campaign calling (replace frontend calling flow)
  const startCampaignCallingBackend = async () => {
    try {
      if (!campaign?._id) return;
      // Get primary agent ID for campaign
      setIsTogglingCampaign(true);
      // Automatically determine mode based on agent configuration
      const primaryAgentId = getPrimaryAgentId();
      let currentMode = "serial"; // Default fallback
      if (primaryAgentId) {
        currentMode = await fetchAgentConfig(primaryAgentId);
        await fetchAgentDispositions(primaryAgentId);
      }
      const runSeries = currentMode === "serial";
      console.log(
        `🚀 CAMPAIGN: Starting campaign in ${
          runSeries ? "SERIES" : "PARALLEL"
        } mode (agent config: ${currentMode})`
      );
      if (runSeries) {
        // Start series calling via backend
        const token = sessionStorage.getItem("clienttoken");
        const resp = await fetch(`${API_BASE}/series-campaign/start`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            campaignId: campaign._id,
            agentId: primaryAgentId,
            minDelayMs: 5000,
          }),
        });
        const data = await resp.json();
        if (!resp.ok || data.error) {
          throw new Error(data.error || "Failed to start series campaign");
        }
        let newRunId = null;
        try {
          newRunId = data?.status?.runId;
          if (newRunId) {
            setCurrentRunId(newRunId);
            setCampaignStartTime(new Date());
          }
        } catch (_) {}
        setCampaign((prev) => (prev ? { ...prev, isRunning: true } : prev));
        setLastUpdated(new Date());
        // Begin polling series status to reflect progress in UI
        startSeriesStatusPolling(campaign._id);
        setIsSeriesMode(true);
        // Broadcast status change to other tabs
        const channel = new BroadcastChannel(`campaign-status-${campaign._id}`);
        channel.postMessage({
          type: 'campaign-status-update',
          isRunning: true,
          runId: newRunId,
          timestamp: Date.now()
        });
        channel.close();
      } else {
        // Keep existing parallel behavior
        const result = await universalCalling({
          type: "campaign",
          agentId: primaryAgentId,
          delayBetweenCalls: 2000,
          onSuccess: (data) => {
            // Capture runId from backend and start local tracking
            try {
              const newRunId = data?.data?.runId;
              if (newRunId) {
                setCurrentRunId(newRunId);
                setCampaignStartTime(new Date());
              }
            } catch (_) {}
            setCampaign((prev) => (prev ? { ...prev, isRunning: true } : prev));
            setLastUpdated(new Date());
          },
          onError: (error) => {
            console.error("Start calling failed:", error);
          },
        });
        if (!result.success) {
          // Error handling is done in universalCalling
          return;
        }
      }
    } catch (e) {
      console.error("Start calling failed:", e);
      toast.error("Failed to start campaign calling");
    } finally {
      setIsTogglingCampaign(false);
    }
  };
  const stopCampaignCallingBackend = async () => {
    try {
      console.log("🛑 FRONTEND: stopCampaignCallingBackend started");
      if (!campaign?._id) {
        console.log("❌ FRONTEND: No campaign ID");
        return;
      }
      setIsTogglingCampaign(true);
      const token = sessionStorage.getItem("clienttoken");
      // Handle series mode differently
      if (isSeriesMode) {
        console.log("🛑 FRONTEND: Stopping series campaign");
        const resp = await fetch(`${API_BASE}/series-campaign/stop`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ campaignId: campaign._id }),
        });
        const result = await resp.json();
        if (!resp.ok || result.error) {
          console.log("❌ FRONTEND: Series stop failed:", result.error);
          toast.error(result.error || "Failed to stop series campaign");
          return;
        }
        console.log("✅ FRONTEND: Series campaign stopped");
      } else {
        console.log("🛑 FRONTEND: Making API call to stop parallel campaign");
        const resp = await fetch(
          `${API_BASE}/campaigns/${campaign._id}/stop-calling`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("🛑 FRONTEND: API response status:", resp.status);
        const result = await resp.json();
        console.log("🛑 FRONTEND: API response result:", result);
        if (!resp.ok || result.success === false) {
          console.log("❌ FRONTEND: API call failed:", result.error);
          toast.error(result.error || "Failed to stop campaign calling");
          return;
        }
      }
      setCampaign((prev) => (prev ? { ...prev, isRunning: false } : prev));
      // Clear calling state from localStorage to prevent auto-restart
      clearCallingState();
      // Reset calling status to idle to prevent auto-resume
      setCallingStatus("idle");
      // Reset the restored from storage flag to prevent auto-resume
      restoredFromStorageRef.current = false;
      // Mark UI as ready for next run and stop any live polling
      setReadyFlag(true);
      stopLiveCallPolling();
      stopSeriesStatusPolling();
      setIsSeriesMode(false);
      setLastUpdated(new Date());
      // Broadcast status change to other tabs
      const channel = new BroadcastChannel(`campaign-status-${campaign._id}`);
      channel.postMessage({
        type: 'campaign-status-update',
        isRunning: false,
        runId: null,
        timestamp: Date.now()
      });
      channel.close();
    } catch (e) {
      console.error("Stop calling failed:", e);
      toast.error("Failed to stop campaign calling");
    } finally {
      setIsTogglingCampaign(false);
    }
  };
  // SERIES STATUS POLLING
  const seriesStatusIntervalRef = useRef(null);
  const [seriesStatus, setSeriesStatus] = useState({
    isRunning: false,
    currentIndex: 0,
    total: 0,
  });
  const startSeriesStatusPolling = (cid) => {
    try {
      stopSeriesStatusPolling();
      let lastIndex = -1;
      let lastRunningState = null;
      seriesStatusIntervalRef.current = setInterval(async () => {
        try {
          const resp = await fetch(`${API_BASE}/series-campaign/status/${cid}`);
          if (!resp.ok) return;
          const data = await resp.json();
          const status = data?.status || null;
          if (status) {
            const total = Array.isArray(campaign?.contacts)
              ? campaign.contacts.length
              : 0;
            const currentIndex = Number(status.currentIndex || 0);
            const isRunning = !!status.isRunning;
            setSeriesStatus({
              isRunning: isRunning,
              currentIndex: currentIndex,
              total: total,
            });
            // Only update campaign running state if it actually changed to prevent flicker
            if (lastRunningState !== isRunning) {
              setCampaign((prev) =>
                prev ? { ...prev, isRunning: isRunning } : prev
              );
              lastRunningState = isRunning;
              // Broadcast status change to other tabs
              const channel = new BroadcastChannel(`campaign-status-${cid}`);
              channel.postMessage({
                type: 'campaign-status-update',
                isRunning: isRunning,
                runId: currentRunId,
                timestamp: Date.now()
              });
              channel.close();
            }
            // If progressed to next contact, refresh campaign details in UI
            if (currentIndex !== lastIndex) {
              lastIndex = currentIndex;
              try {
                await fetchCampaignDetails();
              } catch {}
              setLastUpdated(new Date());
              try {
                const humanIndex = lastIndex + 1;
                if (isRunning) {
                }
              } catch {}
            }
            // Stop polling when finished and update UI flag
            if (!isRunning) {
              stopSeriesStatusPolling();
              setCampaign((prev) =>
                prev ? { ...prev, isRunning: false } : prev
              );
              // Add small delay to ensure backend has finished saving to database
              setTimeout(async () => {
                try {
                  await fetchCampaignHistory(cid);
                } catch {}
                try {
                  await fetchCampaignDetails();
                } catch {}
                setLastUpdated(new Date());
                try {
                  toast.success("Series run completed and saved to history");
                } catch {}
              }, 1000);
              setIsSeriesMode(false);
            }
          }
        } catch (error) {
          console.log("Series status polling error:", error);
        }
      }, 3000);
    } catch (_) {}
  };
  const stopSeriesStatusPolling = () => {
    if (seriesStatusIntervalRef.current) {
      clearInterval(seriesStatusIntervalRef.current);
      seriesStatusIntervalRef.current = null;
    }
  };
  // Campaign history functions
  const saveCampaignRun = async (
    campaignId,
    startTime,
    endTime,
    runTime,
    callLogs,
    runId
  ) => {
    // Skip saving from frontend during Series mode; backend auto-saves at the end
    if (isSeriesMode) {
      try {
        console.log(
          "💾 FRONTEND: Skipping save during series mode (backend will auto-save)"
        );
      } catch {}
      return;
    }
    try {
      console.log("💾 FRONTEND: saveCampaignRun called with:", {
        campaignId,
        startTime,
        endTime,
        runTime,
        callLogsCount: callLogs?.length || 0,
        runId,
      });
      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/save-run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
          body: JSON.stringify({
            startTime,
            endTime,
            runTime,
            callLogs,
            runId: ensureRunId(runId, "save-run"),
          }),
        }
      );
      console.log("💾 FRONTEND: Save response status:", response.status);
      const data = await response.json();
      console.log("💾 FRONTEND: Save response data:", data);
      if (data.success) {
        // Refresh campaign history
        fetchCampaignHistory(campaignId);
        toast.success(
          `Campaign run #${data.data.instanceNumber} saved successfully`
        );
      }
    } catch (error) {
      console.error("Error saving campaign run:", error);
      toast.error("Failed to save campaign run");
    }
  };
  const fetchCampaignHistory = async (campaignId) => {
    try {
      setCampaignHistoryLoading(true);
      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/history`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setCampaignHistory(data.data);
      }
    } catch (error) {
      console.error("Error fetching campaign history:", error);
    } finally {
      setCampaignHistoryLoading(false);
    }
  };
  // Load campaign runs history on mount and when campaignId changes
  useEffect(() => {
    if (campaignId) {
      fetchCampaignHistory(campaignId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);
  const fetchCurrentRunCallLogs = async (runId) => {
    try {
      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/merged-calls?runId=${runId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching current run call logs:", error);
      return [];
    }
  };
  const calculateRunTime = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
  };
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  const handleToggleCampaignCalling = async () => {
    // Prevent multiple simultaneous toggles
    if (isTogglingCampaign) {
      console.log("🔄 FRONTEND: Toggle already in progress, ignoring");
      return;
    }
    setIsTogglingCampaign(true);
    try {
      if (campaign?.isRunning) {
        // Stopping campaign - DON'T save immediately, let backend handle it
        const confirmStop = window.confirm(
          "Are you sure you want to stop this campaign? Ongoing calls will complete naturally."
        );
        if (!confirmStop) return;
        console.log(
          "🛑 FRONTEND: Stopping campaign, waiting for calls to complete..."
        );
        // Stop campaign (this will wait for ongoing calls to complete)
        await stopCampaignCallingBackend();
        // Reset run tracking
        setCurrentRunId(null);
        setRunStartTime(null);
        setCurrentRunCallLogs([]);
        setIsLiveCallActive(false);
        // Clear calling state to prevent auto-restart
        clearCallingState();
        // Reset calling status to idle
        setCallingStatus("idle");
        // Reset the restored from storage flag
        restoredFromStorageRef.current = false;
        // Refresh call logs to show the final state
        await fetchApiMergedCalls(1, false, false);
        // Broadcast status change to other tabs
        const channel = new BroadcastChannel(`campaign-status-${campaignId}`);
        channel.postMessage({
          type: 'campaign-status-update',
          isRunning: false,
          runId: null,
          timestamp: Date.now()
        });
        channel.close();
        toast.success("Campaign stopped - ongoing calls will complete naturally");
      } else {
        const confirmStart = window.confirm("Start the campaign now?");
        if (!confirmStart) return;
        // Start campaign
        await startCampaignCallingBackend();
        // When a new run begins, ensure we show live data again
        setIsLiveCallActive(true);
        // Broadcast status change to other tabs
        const channel = new BroadcastChannel(`campaign-status-${campaignId}`);
        channel.postMessage({
          type: 'campaign-status-update',
          isRunning: true,
          runId: currentRunId,
          timestamp: Date.now()
        });
        channel.close();
      }
    } finally {
      setIsTogglingCampaign(false);
    }
  };
  // CampaignHistoryCard component
  const CampaignHistoryCard = ({ run, index }) => {
    const runKey = `run-${run._id || run.instanceNumber || index}`;
    const isExpanded = !!historyExpanded[runKey];
    const setIsExpanded = (val) =>
      setHistoryExpanded((prev) => ({ ...prev, [runKey]: val }));
    const handleForceSaveHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Not authenticated");
          return;
        }
        const resp = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL || ""
          }/api/v1/client/campaigns/${campaignId}/force-save-history`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ runId: run.runId }),
          }
        );
        const data = await resp.json();
        if (!resp.ok || !data?.success) {
          throw new Error(data?.error || "Force save failed");
        }
        toast.success("History saved");
        await fetchCampaignHistory(campaignId);
      } catch (e) {
        console.error("Force save history failed:", e);
        toast.error(e.message || "Failed to save history");
      }
    };
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-4">
        <div className="p-4 hover:bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  #{run.instanceNumber}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Campaign Run #{run.instanceNumber}
                </h3>
                <p className="text-sm text-gray-600 flex flex-wrap items-center gap-3">
                  {(() => {
                    const parseDate = (val) => {
                      const d = new Date(val);
                      return isNaN(d.getTime()) ? null : d;
                    };
                    const dateObj =
                      parseDate(run.createdAt) || parseDate(run.startTime) || new Date();
                    const startObj =
                      parseDate(run.startTime) || parseDate(run.createdAt);
                    const endObj =
                      parseDate(run.endTime) || parseDate(run.updatedAt) || startObj;
                    const dateStr = dateObj
                      ? dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
                      : "-";
                    const startStr = startObj
                      ? startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : "-";
                    const endStr = endObj
                      ? endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : "-";
                    return (
                      <>
                        <span><strong>Date:</strong> {dateStr}</span>
                        <span><strong>Start:</strong> {startStr}</span>
                        <span><strong>End:</strong> {endStr}</span>
                      </>
                    );
                  })()}
                  <span className="inline-flex items-center gap-1">
                    <FiClock />
                    <strong>Duration:</strong> {formatHMSCompact(
                      (run.runTime?.hours || 0) * 3600 +
                        (run.runTime?.minutes || 0) * 60 +
                        (run.runTime?.seconds || 0)
                    )}
                  </span>
                  {(() => {
                    // Resolve agentName, groupName, and numeric contact range if present in run
                    const agentName = run.agentName || (Array.isArray(run.agent) ? run.agent[0] : run.agentName);
                    const groupName = run.groupName || run.group || run.groupTitle;
                    // Prefer explicit start/end indexes if available; else fallback to contacts length
                    const hasExplicitRange = Number.isInteger(run.startIndex) && Number.isInteger(run.endIndex);
                    const startNum = hasExplicitRange ? (Number(run.startIndex) + 1) : 1;
                    const endNum = hasExplicitRange
                      ? Number(run.endIndex)
                      : (Array.isArray(run.contacts) ? run.contacts.length : undefined);
                    const range = endNum ? `${startNum}-${endNum}` : undefined;
                    return (
                      <>
                        {agentName ? <span><strong>Agent:</strong> {agentName}</span> : null}
                        {groupName ? <span><strong>Group:</strong> {groupName}</span> : null}
                        {range ? <span><strong>Range:</strong> {range}</span> : null}
                      </>
                    );
                  })()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* <button
                type="button"
                onClick={handleForceSaveHistory}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700"
                title="Force save this run to history"
              >
                Force Save History
              </button> */}
              {!isExpanded && (
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {run.stats.successfulCalls} Connected,{" "}
                    {run.stats.failedCalls} Not Connected
                  </div>
                  <div className="text-xs text-gray-500">
                    {run.stats.totalContacts} total contacts
                  </div>
                </div>
              )}
              <button
                type="button"
                className="text-gray-600 hover:text-gray-800 p-1 rounded"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                <span className="inline-block align-middle">
                  {isExpanded ? "▼" : "▶"}
                </span>
              </button>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="border-t border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {run.stats.totalContacts}
                </div>
                <div className="text-sm text-blue-800">Total Contacts</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {run.stats.successfulCalls}
                </div>
                <div className="text-sm text-green-800">Connected Calls</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {run.stats.failedCalls}
                </div>
                <div className="text-sm text-red-800">Not Connected Calls</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatHMSCompact(run.stats?.totalCallDuration || 0)}
                </div>
                <div className="text-sm text-purple-800">Total Duration</div>
              </div>
            </div>
            {/* History table - mirrors Recent call logs */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 mb-2">Call Logs</h4>
              {/* Controls: filter, sort, flag/disposition filters, call missed again */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCallFilter("all")}
                      className={`text-sm px-3 py-1 rounded border ${
                        callFilter === "all"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallFilter("connected")}
                      className={`text-sm px-3 py-1 rounded border ${
                        callFilter === "connected"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Connected
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallFilter("missed")}
                      className={`text-sm px-3 py-1 rounded border ${
                        callFilter === "missed"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Missed
                    </button>
                  </div>
                  {/* removed top-level Flag and Disposition selects; header filters are used instead */}
                  <div className="inline-flex items-center gap-2 ml-2">
                    <button
                      type="button"
                      onClick={() => setDurationSort("longest")}
                      className={`text-sm px-3 py-1 rounded border ${
                        durationSort === "longest"
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="inline" />
                        <span className="text-xs">↑</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationSort("shortest")}
                      className={`text-sm px-3 py-1 rounded border ${
                        durationSort === "shortest"
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="inline" />
                        <span className="text-xs">↓</span>
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Bookmark-only toggle for Call Logs filter bar */}
                  <button
                    type="button"
                    onClick={() => {
                      setBookmarkedOnly((prev) => {
                        const next = !prev;
                        try { localStorage.setItem(getStorageKey('filterBookmarkedOnly'), String(next)); } catch (_) {}
                        return next;
                      });
                    }}
                    className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded border ${bookmarkedOnly ? 'bg-yellow-100 border-yellow-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    title={bookmarkedOnly ? 'Show all' : 'Show bookmarked only'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-yellow-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    {bookmarkedOnly ? 'Bookmarked' : 'Star'}
                  </button>
                  {callFilter === "missed" && (
                    <button
                      className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      onClick={() => {
                        callMissedCalls();
                      }}
                      disabled={
                        apiMergedCallsLoading ||
                        !campaignGroups ||
                        campaignGroups.length === 0
                      }
                      title={
                        !campaignGroups || campaignGroups.length === 0
                          ? "No groups assigned to campaign"
                          : "Call all not connected contacts"
                      }
                    >
                      Call Again
                    </button>
                  )}
                  {/* Select & Call for history logs (per run) */}
                  <button
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={() => {
                      // Build a filtered list of this run's contacts using same filters
                      const filtered = (run.contacts || []).filter((lead) => {
                        const name = (lead.name || "").toString().trim();
                        const number = (lead.number || lead.phone || "")
                          .toString()
                          .trim();
                        const hasRealName = name && name !== "-";
                        const hasRealNumber =
                          number && number !== "-" && /\d/.test(number);
                        const byData = hasRealName || hasRealNumber;
                        const status = (lead.status || "").toLowerCase();
                        const connectedStatuses = [
                          "connected",
                          "completed",
                          "ongoing",
                        ];
                        const missedStatuses = [
                          "missed",
                          "not_connected",
                          "failed",
                        ];
                        const byStatus =
                          callFilter === "all"
                            ? true
                            : callFilter === "connected"
                            ? connectedStatuses.includes(status)
                            : missedStatuses.includes(status);
                        // Bookmark-only filter persisted in localStorage (from Star button)
                        const bookmarkedOnly = Boolean(
                          (typeof window !== 'undefined') && localStorage.getItem(getStorageKey('filterBookmarkedOnly')) === 'true'
                        ) || Boolean(bookmarkedOnly);
                        const idCandidate = lead.contactId || lead.documentId || lead._id || (lead.phone || lead.number);
                        const isBk = idCandidate && (typeof isContactBookmarked === 'function')
                          ? isContactBookmarked({ _id: idCandidate, phone: lead.phone, number: lead.number })
                          : false;
                        // Apply flag filter using local rowDisposition (row id resolution mirrors below rendering)
                        const rowId = `${run.instanceNumber || run._id || index}-${
                          lead.documentId || lead.contactId || `${idx}`
                        }`;
                        const selectedFlag = rowDisposition[rowId];
                        const byFlag =
                          flagFilter === "all"
                            ? true
                            : flagFilter === "unlabeled"
                            ? !selectedFlag
                            : selectedFlag === flagFilter;
                        // Apply disposition filter using backend fields
                        const leadDisposition =
                          (lead.leadStatus || lead.disposition || "").toLowerCase();
                        const byDisposition =
                          dispositionFilter === "all"
                            ? true
                            : leadDisposition === dispositionFilter;
                        return byData && byStatus && byFlag && byDisposition && (bookmarkedOnly ? isBk : true);
                      });
                      if (filtered.length === 0) {
                        toast.warn("No logs to call for the selected filter");
                        return;
                      }
                      universalCalling({
                        type: "selected",
                        contacts: filtered,
                        runId: undefined,
                        newInstance: true,
                      });
                    }}
                    title="Call the filtered logs from this run"
                  >
                    Call Selected
                  </button>
                {/* Bulk download unified dropdown for selected history */}
                <div className="relative">
                  <button
                    className="text-sm px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                    onClick={() => setShowHistoryDownloadMenu((v)=>!v)}
                    disabled={selectedCallLogs.length === 0}
                    title="Download selected"
                  >
                    <FiDownload />
                    Download
                    <span className="inline-block border-l border-white/20 pl-2">▾</span>
                  </button>
                  {showHistoryDownloadMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50 overflow-hidden ring-1 ring-black/5">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => { setShowHistoryDownloadMenu(false); handleDownloadSelectedHistoryCSV(); }}
                        disabled={isDownloadingHistoryCSV}
                      >
                        {isDownloadingHistoryCSV && <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>}
                        Excel (CSV)
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => { setShowHistoryDownloadMenu(false); handleDownloadSelectedHistoryPDF(); }}
                        disabled={isDownloadingHistoryPDF}
                      >
                        {isDownloadingHistoryPDF && <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>}
                        PDF
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => { setShowHistoryDownloadMenu(false); handleDownloadSelectedHistoryTXT(); }}
                        disabled={isDownloadingHistoryTXT}
                      >
                        {isDownloadingHistoryTXT && <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>}
                        Text (TXT)
                      </button>
                    </div>
                  )}
                </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-left text-gray-700">
                      <th className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={(() => {
                            const filtered = (run.contacts || []).filter(
                              (lead) => {
                                const name = (lead.name || "")
                                  .toString()
                                  .trim();
                                const number = (lead.number || lead.phone || "")
                                  .toString()
                                  .trim();
                                const hasRealName = name && name !== "-";
                                const hasRealNumber =
                                  number && number !== "-" && /\d/.test(number);
                                const byData = hasRealName || hasRealNumber;
                                const status = (
                                  lead.status || ""
                                ).toLowerCase();
                                const connectedStatuses = [
                                  "connected",
                                  "completed",
                                  "ongoing",
                                ];
                                const missedStatuses = [
                                  "missed",
                                  "not_connected",
                                  "failed",
                                ];
                                const byStatus =
                                  callFilter === "all"
                                    ? true
                                    : callFilter === "connected"
                                    ? connectedStatuses.includes(status)
                                    : missedStatuses.includes(status);
                                // Apply flag filter using local rowDisposition (row id resolution mirrors below rendering)
                                const rowId = `${run.instanceNumber || run._id || index}-${
                                  lead.documentId || lead.contactId || `${idx}`
                                }`;
                                const selectedFlag = rowDisposition[rowId];
                                const byFlag =
                                  flagFilter === "all"
                                    ? true
                                    : flagFilter === "unlabeled"
                                    ? !selectedFlag
                                    : selectedFlag === flagFilter;
                                // Apply disposition filter using backend fields
                                const leadDisposition =
                                  (lead.leadStatus || lead.disposition || "").toLowerCase();
                                const byDisposition =
                                  dispositionFilter === "all"
                                    ? true
                                    : leadDisposition === dispositionFilter;
                                return byData && byStatus && byFlag && byDisposition;
                              }
                            );
                            return (
                              filtered.length > 0 &&
                              filtered.every((l) => isCallLogSelected(l))
                            );
                          })()}
                          onChange={(e) => {
                            const filtered = (run.contacts || []).filter(
                              (lead) => {
                                const name = (lead.name || "")
                                  .toString()
                                  .trim();
                                const number = (lead.number || lead.phone || "")
                                  .toString()
                                  .trim();
                                const hasRealName = name && name !== "-";
                                const hasRealNumber =
                                  number && number !== "-" && /\d/.test(number);
                                const byData = hasRealName || hasRealNumber;
                                const status = (
                                  lead.status || ""
                                ).toLowerCase();
                                const connectedStatuses = [
                                  "connected",
                                  "completed",
                                  "ongoing",
                                ];
                                const missedStatuses = [
                                  "missed",
                                  "not_connected",
                                  "failed",
                                ];
                                const byStatus =
                                  callFilter === "all"
                                    ? true
                                    : callFilter === "connected"
                                    ? connectedStatuses.includes(status)
                                    : missedStatuses.includes(status);
                                // Flag filter
                                const rowId = `${run.instanceNumber || run._id || index}-${
                                  lead.documentId || lead.contactId || `${idx}`
                                }`;
                                const selectedFlag = rowDisposition[rowId];
                                const byFlag =
                                  flagFilter === "all"
                                    ? true
                                    : flagFilter === "unlabeled"
                                    ? !selectedFlag
                                    : selectedFlag === flagFilter;
                                // Disposition filter
                                const leadDisposition = (
                                  lead.leadStatus || lead.disposition || ""
                                ).toLowerCase();
                                const byDisposition =
                                  dispositionFilter === "all"
                                    ? true
                                    : leadDisposition === dispositionFilter;
                                return byData && byStatus && byFlag && byDisposition;
                              }
                            );
                            const allSelected =
                              filtered.length > 0 &&
                              filtered.every((l) => isCallLogSelected(l));
                            if (allSelected) {
                              // unselect these
                              setSelectedCallLogs((prev) =>
                                prev.filter(
                                  (c) =>
                                    !filtered.some(
                                      (f) =>
                                        (f.documentId ||
                                          f.contactId ||
                                          getLeadKey(f) ||
                                          f._id) ===
                                        (c.documentId ||
                                          c.contactId ||
                                          getLeadKey(c) ||
                                          c._id)
                                    )
                                )
                              );
                            } else {
                              // add all filtered (dedupe by key)
                              setSelectedCallLogs((prev) => {
                                const existing = new Set(
                                  prev.map(
                                    (c) =>
                                      c.documentId ||
                                      c.contactId ||
                                      getLeadKey(c) ||
                                      c._id
                                  )
                                );
                                const toAdd = filtered.filter((f) => {
                                  const k =
                                    f.documentId ||
                                    f.contactId ||
                                    getLeadKey(f) ||
                                    f._id;
                                  return !existing.has(k);
                                });
                                return [...prev, ...toAdd];
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="py-2 px-3">S. No.</th>
                      <th className="py-2 px-3">Date & Time</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Number</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">⏱</th>
                      <th className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newState = !flagMenuOpen;
                              if (newState) {
                                const position = calculateDropdownPosition(e.target.closest('button'));
                                setFlagMenuPosition(position);
                              }
                              setFlagMenuOpen(newState);
                            }}
                            title="Filter by flag"
                          >
                            Flag
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              className={`p-1 rounded border ${
                                flagFilter !== "all"
                                  ? "bg-yellow-100 border-yellow-300"
                                  : "bg-white border-gray-300 hover:bg-gray-50"
                              }`}
                              title="Filter by flag"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newState = !flagMenuOpen;
                                if (newState) {
                                  const position = calculateDropdownPosition(e.target.closest('button'));
                                  console.log('Setting flag menu position to:', position);
                                  setFlagMenuPosition(position);
                                }
                                setFlagMenuOpen(newState);
                              }}
                            >
                              {/* small flag icon */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-gray-700"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 6v14M4 6h12l-3 4 3 4H4"
                                />
                              </svg>
                            </button>
                            {flagMenuOpen && (
                              <div
                                className={`absolute right-0 w-44 bg-white border border-gray-200 rounded shadow-lg z-[100] p-2 min-h-[100px] ${
                                  flagMenuPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
                                }`}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  backgroundColor: flagMenuPosition === "top" ? "#fef3c7" : "#ffffff",
                                  border: flagMenuPosition === "top" ? "2px solid #f59e0b" : "1px solid #e5e7eb"
                                }}
                              >
                                {(() => {
                                  // Default flag options
                                  const defaultFlagOptions = [
                                    { key: "interested", label: "Interested" },
                                    { key: "not interested", label: "Not Interested" },
                                    { key: "maybe", label: "Maybe" },
                                    { key: "do not call", label: "Do Not Call" },
                                  ];
                                  const flagOptions = agentDispositions.length > 0
                                    ? agentDispositions.map(disp => {
                                        if (disp.title) {
                                          return {
                                            key: disp.title.toLowerCase().replace(/\s+/g, '_'),
                                            label: disp.title
                                          };
                                        } else if (typeof disp === 'string') {
                                          return {
                                            key: disp.toLowerCase().replace(/\s+/g, '_'),
                                            label: disp
                                          };
                                        } else if (disp.key && disp.label) {
                                          return disp;
                                        }
                                        return null;
                                      }).filter(Boolean)
                                    : defaultFlagOptions;
                                  const options = [
                                    { key: "all", label: "All" },
                                    { key: "unlabeled", label: "Unlabeled" },
                                    ...flagOptions
                                  ];
                                  return (
                                    <div className="py-1">
                                      {options.map((opt) => (
                                        <button
                                          key={opt.key}
                                          data-filter-button
                                          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                                            opt.key === flagFilter ? "bg-yellow-50" : ""
                                          }`}
                                          onClick={(e) => {
                                            // Allow normal click behavior for filter selection
                                            setFlagFilter(opt.key);
                                            setFlagMenuOpen(false);
                                          }}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </th>
                      <th className="py-2 px-3">Conversation</th>
                      <th className="py-2 px-3">CC</th>
                      <th className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newState = !dispMenuOpen;
                              if (newState) {
                                const position = calculateDropdownPosition(e.target.closest('button'));
                                setDispMenuPosition(position);
                              }
                              setDispMenuOpen(newState);
                            }}
                            title="Filter by disposition"
                          >
                            {agentDispositions.length > 0 ? "Disposition" : "Disposition"}
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              className={`p-1 rounded border ${
                                dispositionFilter !== "all"
                                  ? "bg-blue-100 border-blue-300"
                                  : "bg-white border-gray-300 hover:bg-gray-50"
                              }`}
                              title="Filter by disposition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDispMenuOpen((v) => !v);
                              }}
                            >
                              {/* funnel icon */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-gray-700"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 4h18l-7 8v6l-4 2v-8L3 4z"
                                />
                              </svg>
                            </button>
                            {dispMenuOpen && (
                              <div
                                className={`absolute right-0 w-56 max-h-64 overflow-auto bg-white border border-gray-200 rounded shadow-lg z-[100] p-2 min-h-[100px] ${
                                  dispMenuPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
                                }`}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(() => {
                                  // Default dispositions
                                  const defaultDispositions = [
                                    { key: "vvi", label: "Very Very Interested" },
                                    { key: "maybe", label: "Maybe" },
                                    { key: "enrolled", label: "Enrolled" },
                                    { key: "junk_lead", label: "Junk Lead" },
                                    { key: "not_required", label: "Not Required" },
                                    { key: "enrolled_other", label: "Enrolled Other" },
                                    { key: "decline", label: "Decline" },
                                    { key: "not_eligible", label: "Not Eligible" },
                                    { key: "wrong_number", label: "Wrong Number" },
                                    { key: "hot_followup", label: "Hot Followup" },
                                    { key: "cold_followup", label: "Cold Followup" },
                                    { key: "schedule", label: "Schedule" },
                                    { key: "not_connected", label: "Not Connected" },
                                  ];
                                  const dispositionOptions = agentDispositions.length > 0
                                    ? agentDispositions.map(disp => {
                                        if (disp.title) {
                                          return {
                                            key: disp.title.toLowerCase().replace(/\s+/g, '_'),
                                            label: disp.title
                                          };
                                        } else if (typeof disp === 'string') {
                                          return {
                                            key: disp.toLowerCase().replace(/\s+/g, '_'),
                                            label: disp
                                          };
                                        } else if (disp.key && disp.label) {
                                          return disp;
                                        }
                                        return null;
                                      }).filter(Boolean)
                                    : defaultDispositions;
                                  const options = [
                                    { key: "all", label: "All" },
                                    ...dispositionOptions
                                  ];
                                  return (
                                    <div className="py-1">
                                      {options.map((opt) => (
                                        <button
                                          key={opt.key}
                                          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                                            opt.key === dispositionFilter ? "bg-blue-50" : ""
                                          }`}
                                          onClick={() => {
                                            setDispositionFilter(opt.key);
                                            setDispMenuOpen(false);
                                          }}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Redial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(run.contacts || [])
                      .filter((lead) => {
                        const name = (lead.name || "").toString().trim();
                        const number = (lead.number || lead.phone || "")
                          .toString()
                          .trim();
                        const hasRealName = name && name !== "-";
                        const hasRealNumber =
                          number && number !== "-" && /\d/.test(number);
                        const byData = hasRealName || hasRealNumber;
                        const status = (lead.status || "").toLowerCase();
                        const connectedStatuses = [
                          "connected",
                          "completed",
                          "ongoing",
                        ];
                        const missedStatuses = [
                          "missed",
                          "not_connected",
                          "failed",
                        ];
                        // In NGR mode we exclude live statuses from recent table; in serial we show all
                        if (agentConfigMode !== "serial") {
                          const isLive =
                            status === "ringing" || status === "ongoing";
                          if (isLive) return false;
                        }
                        const byStatus =
                          callFilter === "all"
                            ? true
                            : callFilter === "connected"
                            ? connectedStatuses.includes(status)
                            : missedStatuses.includes(status);
                        // Flag filter
                        const rowId = `${run.instanceNumber || run._id || index}-${
                          lead.documentId || lead.contactId || `${idx}`
                        }`;
                        const selectedFlag = rowDisposition[rowId];
                        const byFlag =
                          flagFilter === "all"
                            ? true
                            : flagFilter === "unlabeled"
                            ? !selectedFlag
                            : selectedFlag === flagFilter;
                        // Disposition filter
                        const leadDisposition = (
                          lead.leadStatus || lead.disposition || ""
                        ).toLowerCase();
                        const byDisposition =
                          dispositionFilter === "all"
                            ? true
                            : leadDisposition === dispositionFilter;
                        // Bookmark-only filter (persisted in localStorage and state)
                        const idCandidate =
                          lead.contactId ||
                          lead.documentId ||
                          lead._id ||
                          (lead.phone || lead.number);
                        const isBk = idCandidate
                          ? isContactBookmarked({
                              _id: idCandidate,
                              phone: lead.phone,
                              number: lead.number,
                            })
                          : false;
                        return (
                          byData &&
                          byStatus &&
                          byFlag &&
                          byDisposition &&
                          (bookmarkedOnly ? isBk : true)
                        );
                      })
                      .sort((a, b) => {
                        if (durationSort === "none") return 0;
                        const getSec = (lead) => {
                          const d = lead.duration;
                          if (!d) return 0;
                          const s = String(d);
                          if (s.includes(":")) {
                            const p = s.split(":");
                            if (p.length === 2)
                              return (
                                (parseInt(p[0]) || 0) * 60 +
                                (parseInt(p[1]) || 0)
                              );
                          }
                          const n = parseInt(s);
                          return isNaN(n) ? 0 : n;
                        };
                        const A = getSec(a),
                          B = getSec(b);
                        return durationSort === "longest" ? B - A : A - B;
                      })
                      .map((lead, idx) => (
                        <tr
                          key={`${
                            lead.documentId || lead.contactId || "hrow"
                          }-${idx}`}
                          className={`hover:bg-gray-50 ${
                            isCallLogSelected(lead)
                              ? "bg-blue-50 border-blue-200"
                              : ""
                          }`}
                        >
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={isCallLogSelected(lead)}
                              onChange={() => handleSelectCallLog(lead)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-gray-700">{idx + 1}</td>
                          <td className="py-2 px-3 text-gray-700 flex flex-col items-center gap-2">
                            <span>
                              {lead.time
                                ? new Date(lead.time).toLocaleDateString()
                                : "-"}{" "}
                            </span>
                            <span>
                              {lead.time
                                ? new Date(lead.time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-900">
                            {getContactDisplayNameBlank(lead)}
                          </td>
                          <td className="py-2 px-3 text-gray-900">
                            {lead.number || lead.phone || "-"}
                          </td>
                          <td className="py-2 px-3 capitalize">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                lead.status === "ringing"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : lead.status === "ongoing"
                                  ? "bg-blue-100 text-blue-700"
                                  : lead.status === "missed" ||
                                    lead.status === "not_connected" ||
                                    lead.status === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {formatDuration(lead.duration)}
                          </td>
                          <td className="py-2 px-3">
                            {/* Reuse same flag dropdown logic via rowDisposition */}
                            {(() => {
                              const uniquePrefix = `history-${
                                run.instanceNumber || run._id || index
                              }`;
                              const rowId = `${uniquePrefix}-${
                                lead.documentId || lead.contactId || `${idx}`
                              }`;
                              const selected = rowDisposition[rowId];
                              const colorClass =
                                selected === "interested"
                                  ? "bg-green-200 text-green-900 border-green-300"
                                  : selected === "not interested"
                                  ? "bg-red-200 text-red-900 border-red-300"
                                  : selected === "maybe"
                                  ? "bg-yellow-200 text-yellow-900 border-yellow-300"
                                  : selected === "do not call"
                                  ? "bg-gray-200 text-gray-800 border-gray-300"
                                  : "bg-gray-50 text-gray-700 border-gray-200";
                              const label = selected ? selected : "Select";
                              return (
                                <div
                                  className="relative inline-block text-left"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className={`inline-flex items-center px-3 py-1 text-xs border rounded ${colorClass}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Ensure the history card remains open while interacting
                                      setIsExpanded(true);
                                      const direction = calculateDropdownPosition(e.currentTarget);
                                      setRowDispositionPosition((prev) => ({ ...prev, [rowId]: direction }));
                                      setOpenDispositionFor(
                                        openDispositionFor === rowId
                                          ? null
                                          : rowId
                                      );
                                    }}
                                  >
                                    {label}
                                    <svg
                                      className="w-4 h-4 ml-2"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </button>
                                  {openDispositionFor === rowId && (
                                    <div
                                      className={`absolute z-10 w-40 bg-white border border-gray-200 rounded shadow ${
                                        (rowDispositionPosition && rowDispositionPosition[rowId]) === "top"
                                          ? "bottom-full mb-1"
                                          : "mt-1"
                                      }`}
                                      onClick={(e) => e.stopPropagation()}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      {(agentDispositions.length > 0 ?
                                        agentDispositions.map(disp => {
                                          if (disp.title) {
                                            // Return only main disposition titles, not sub-dispositions
                                            return {
                                              key: disp.title.toLowerCase().replace(/\s+/g, '_'),
                                              label: disp.title,
                                              cls: "text-blue-700",
                                            };
                                          } else if (typeof disp === 'string') {
                                            return {
                                              key: disp.toLowerCase().replace(/\s+/g, '_'),
                                              label: disp,
                                              cls: "text-blue-700",
                                            };
                                          }
                                          return null;
                                        }).filter(Boolean)
                                      : [
                                        {
                                          key: "interested",
                                          label: "Interested",
                                          cls: "text-green-700",
                                        },
                                        {
                                          key: "not interested",
                                          label: "Not Interested",
                                          cls: "text-red-700",
                                        },
                                        {
                                          key: "maybe",
                                          label: "Maybe",
                                          cls: "text-yellow-700",
                                        },
                                        {
                                          key: "do not call",
                                          label: "Do Not Call",
                                          cls: "text-gray-700",
                                        },
                                      ]).map((opt) => (
                                        <button
                                          key={`${rowId}-${opt.label}`}
                                          type="button"
                                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${opt.cls}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Keep the history card expanded after selection
                                            setIsExpanded(true);
                                            setRowDisposition((prev) => ({
                                              ...prev,
                                              [rowId]: opt.key,
                                            }));
                                            try {
                                              const authToken =
                                                sessionStorage.getItem(
                                                  "clienttoken"
                                                ) ||
                                                localStorage.getItem(
                                                  "admintoken"
                                                );
                                              const url = `${API_BASE}/groups/mark-contact-status`;
                                              const payload = {
                                                campaignId:
                                                  campaign && campaign._id,
                                                phone:
                                                  lead &&
                                                  (lead.number || lead.phone),
                                                status: opt.key || "default",
                                              };
                                              fetch(url, {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                  ...(authToken
                                                    ? {
                                                        Authorization: `Bearer ${authToken}`,
                                                      }
                                                    : {}),
                                                },
                                                body: JSON.stringify(payload),
                                              }).catch(() => {});
                                            } catch (_) {}
                                            setOpenDispositionFor(null);
                                          }}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-2 px-3">
                            {lead.status === "missed" ? (
                              <span className="text-gray-400 text-xs text-center"></span>
                            ) : (
                              <button
                                className={`inline-flex items-center px-3 py-1 text-xs border rounded hover:opacity-80 transition-all duration-200 ${
                                  lead.documentId &&
                                  viewedTranscripts.has(lead.documentId)
                                    ? "bg-green-50 text-fuchsia-700 border-green-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                }`}
                                title={
                                  lead.documentId &&
                                  viewedTranscripts.has(lead.documentId)
                                    ? "Transcript viewed"
                                    : "View transcript"
                                }
                                onClick={() => openTranscriptSmart(lead)}
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 16h8M8 12h8M8 8h8M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H7l-2 2H3v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {(() => {
                                  const baseLabel =
                                    lead.documentId &&
                                    viewedTranscripts.has(lead.documentId)
                                      ? "Viewed"
                                      : "Transcript";
                                  const count =
                                    (typeof lead.transcriptCount === "number"
                                      ? lead.transcriptCount
                                      : undefined) ??
                                    getTranscriptMessageCount(lead);
                                  return count > 0
                                    ? `${baseLabel} (${count})`
                                    : baseLabel;
                                })()}
                              </button>
                            )}
                          </td>
                          {/* CC: conversation count column */}
                          <td className="py-2 px-3 text-gray-700">
                            {(() => {
                              const count =
                                (typeof lead.transcriptCount === "number"
                                  ? lead.transcriptCount
                                  : undefined) ?? getTranscriptMessageCount(lead);
                              return Number(count) || 0;
                            })()}
                          </td>
                          <td className="py-2 px-3">{lead.leadStatus}</td>
                          {/* Action: Bookmark toggle + Assign dropdown */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const idCandidate =
                                  lead.contactId ||
                                  lead.documentId ||
                                  lead._id ||
                                  (lead.phone || lead.number);
                                const isBk = idCandidate
                                  ? isContactBookmarked({
                                      _id: idCandidate,
                                      phone: lead.phone,
                                      number: lead.number,
                                    })
                                  : false;
                                return (
                                  <button
                                    type="button"
                                    className={`p-1 rounded border ${
                                      isBk
                                        ? "bg-yellow-100 border-yellow-300"
                                        : "bg-white border-gray-300 hover:bg-gray-50"
                                    }`}
                                    title={isBk ? "Remove bookmark" : "Add bookmark"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleBookmarkForContact({
                                        _id: idCandidate,
                                        phone: lead.phone,
                                        number: lead.number,
                                      });
                                    }}
                                  >
                                    {/* star icon */}
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill={isBk ? "currentColor" : "none"}
                                      stroke="currentColor"
                                      className="w-4 h-4 text-yellow-500"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                  </button>
                                );
                              })()}
                              {(() => {
                                const rowId = (lead.documentId || lead.contactId || `${idx}`);
                                const key = `assign-${rowId}`;
                                return (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-gray-50"
                                      title="Assign"
                                      onClick={(e) => { e.stopPropagation(); setOpenAssignFor(openAssignFor === key ? null : key); }}
                                    >
                                      Assign ▾
                                    </button>
                                    {openAssignFor === key && (
                                      <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded shadow z-10">
                                        {["t1","t2","t3","t4","t5"].map((tag) => (
                                          <button
                                            key={tag}
                                            type="button"
                                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                                            onClick={(e) => { e.stopPropagation(); setRowAssignments((prev) => ({ ...prev, [rowId]: tag })); setOpenAssignFor(null); }}
                                          >
                                            {tag.toUpperCase()}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                          {/* Redial button in its own column */}
                          <td className="py-2 px-3">
                            <button
                              className="inline-flex items-center px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50"
                              title={
                                !lead.number
                                  ? "No phone number available"
                                  : "Retry this contact"
                              }
                              onClick={() => handleRetryLead(lead)}
                              disabled={!lead.number}
                            >
                              <FiPhone
                                className="w-3 h-3 text-green-700 mx-2"
                                style={{ minWidth: "16px", minHeight: "16px" }}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  // Live call logs functions
  const startLiveCallPolling = async (uniqueId) => {
    if (isPolling) {
      stopLiveCallPolling();
    }
    setIsPolling(true);
    setCallConnectionStatus("connected");
    setLiveTranscript("");
    setLiveTranscriptLines([]);
    setLiveCallDetails(null);
    const pollLogs = async () => {
      try {
        console.log("Polling for uniqueId:", uniqueId);
        const apiUrl = `${API_BASE_URL}/logs?uniqueid=${uniqueId}&limit=1`;
        console.log("API URL:", apiUrl);
        const token = sessionStorage.getItem("clienttoken");
        const response = await fetch(
          `${API_BASE_URL}/logs?uniqueid=${uniqueId}&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Polling response:", result);
        if (result.logs && result.logs.length > 0) {
          const callLog = result.logs[0];
          console.log("Found call log:", callLog);
          setLiveCallDetails(callLog);
          // Check if call is active based on isActive field
          const isCallActiveForStatus = callLog.metadata?.isActive !== false;
          if (isCallActiveForStatus) {
            // Call is active, set connected status
            setCallConnectionStatus("connected");
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
            }
            // Set new timeout for 40 seconds
            connectionTimeoutRef.current = setTimeout(() => {
              console.log(
                "No response for 40 seconds, setting call status to 'not connected'"
              );
              setCallConnectionStatus("not_connected");
            }, 40000);
          } else {
            // Call is not active (isActive is false), set disconnected status
            console.log(
              "Call is not active (isActive: false), setting status to 'not connected'"
            );
            setCallConnectionStatus("not_connected");
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
            // AUTOMATIC: Update campaign call status when call ends
            if (callLog.metadata?.customParams?.uniqueid) {
              console.log(
                `Call ended for ${callLog.metadata.customParams.uniqueid}, automatically updating campaign status...`
              );
              updateCallStatus(callLog.metadata.customParams.uniqueid);
            }
          }
          if (callLog.transcript) {
            setLiveTranscript(callLog.transcript);
            // Parse transcript lines with timestamps and group by speaker
            const rawLines = callLog.transcript
              .split("\n")
              .filter((line) => line.trim());
            const parsedMessages = [];
            let lastMessage = null;
            for (const line of rawLines) {
              const timestampMatch = line.match(/\[([^\]]+)\]/);
              let timestamp = null;
              if (timestampMatch) {
                try {
                  const date = new Date(timestampMatch[1]);
                  if (!isNaN(date.getTime())) {
                    timestamp = date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    });
                  }
                } catch (error) {
                  console.error("Error parsing timestamp:", error);
                }
              }
              const lineWithoutTimestamp = line.replace(/\[[^\]]+\]\s*/, "");
              const colonIndex = lineWithoutTimestamp.indexOf(":");
              if (colonIndex !== -1) {
                const speaker = lineWithoutTimestamp
                  .substring(0, colonIndex)
                  .trim();
                const text = lineWithoutTimestamp
                  .substring(colonIndex + 1)
                  .trim();
                const isAI =
                  speaker.toLowerCase().includes("ai") ||
                  speaker.toLowerCase().includes("agent");
                const isUser =
                  speaker.toLowerCase().includes("user") ||
                  speaker.toLowerCase().includes("customer");
                // Always create a new message entry, even if the speaker repeats
                parsedMessages.push({
                  speaker,
                  text,
                  timestamp,
                  isAI,
                  isUser,
                });
                lastMessage = parsedMessages[parsedMessages.length - 1];
              } else if (lastMessage) {
                lastMessage.text += " " + lineWithoutTimestamp.trim();
              }
            }
            const lines = parsedMessages;
            setLiveTranscriptLines(lines);
            // Cache live message count for selected call (if has documentId)
            try {
              const liveDocKey =
                (selectedCall && selectedCall.documentId) || null;
              if (liveDocKey) {
                const msgCount = Array.isArray(lines) ? lines.length : 0;
                setTranscriptCounts((prev) => {
                  const next = new Map(prev);
                  next.set(liveDocKey, msgCount);
                  return next;
                });
              }
            } catch (_) {}
            // Auto-scroll to bottom when new messages are added
            setTimeout(() => {
              if (transcriptRef.current) {
                transcriptRef.current.scrollTop =
                  transcriptRef.current.scrollHeight;
              }
            }, 100);
          }
          // Check if call is still active (not completed and isActive is true)
          const shouldContinuePolling = callLog.metadata?.isActive !== false;
          const isCallCompleted =
            callLog.leadStatus &&
            ["completed", "ended", "failed"].includes(
              callLog.leadStatus.toLowerCase()
            );
          if (shouldContinuePolling && !isCallCompleted) {
            // Continue polling
            logsPollRef.current = setTimeout(pollLogs, 2000);
          } else {
            // Call completed or not active, stop polling
            console.log("Call completed or not active, stopping polling");
            setIsPolling(false);
          }
        } else {
          // No logs found yet, continue polling
          console.log("No call logs found yet, continuing to poll...");
          logsPollRef.current = setTimeout(pollLogs, 2000);
        }
      } catch (error) {
        console.error("Error polling live call logs:", error);
        // Continue polling even on error
        logsPollRef.current = setTimeout(pollLogs, 2000);
      }
    };
    pollLogs();
  };
  const stopLiveCallPolling = () => {
    if (logsPollRef.current) {
      clearTimeout(logsPollRef.current);
      logsPollRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    setIsPolling(false);
    setCallConnectionStatus("connected");
  };
  // Terminate current live call
  const terminateCurrentCall = async () => {
    try {
      if (!selectedCall) return;
      const agentId = selectedCall.agentId?._id || selectedCall.agentId || null;
      const providerRaw = (
        selectedCall.agentId?.serviceProvider ||
        selectedCall.provider ||
        selectedCall.metadata?.provider ||
        ""
      ).toLowerCase();
      let provider = providerRaw === "c-zentrax" ? "c-zentrix" : providerRaw;
      const uniqueId =
        selectedCall?.metadata?.customParams?.uniqueid ||
        selectedCall?.documentId ||
        selectedCall?.uniqueId ||
        selectedCall?.metadata?.uniqueid ||
        null;
      // Try to pick SANPBX callid if present in the log
      const callid =
        selectedCall?.metadata?.callid ||
        selectedCall?.externalResponse?.callid ||
        null;
      // Extract possible c-zentrix fields if present (to avoid backend lookup)
      const accountSid =
        selectedCall?.metadata?.accountSid ||
        selectedCall?.metadata?.twilio?.accountSid ||
        null;
      const callSid =
        selectedCall?.metadata?.callSid ||
        selectedCall?.metadata?.twilio?.callSid ||
        null;
      const streamSid =
        selectedCall?.metadata?.streamSid ||
        selectedCall?.metadata?.twilio?.streamSid ||
        null;
      // Infer provider as czentrix if unknown but Twilio-like fields exist
      if (
        !provider &&
        (selectedCall?.metadata?.accountSid ||
          selectedCall?.metadata?.twilio?.accountSid)
      ) {
        provider = "czentrix";
      }
      if (provider === "c-zentrix" || provider === "czentrix") {
        // Use backend proxy for CZentrix termination as well
        const token = sessionStorage.getItem("clienttoken");
        const resp = await fetch(`${API_BASE}/series-campaign/terminate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            agentId,
            provider: "czentrix",
            uniqueId,
            accountSid,
            callSid,
            streamSid,
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data.success === false)
          throw new Error(data.error || "Failed to terminate czentrix call");
      } else if (provider === "sanpbx" || provider === "snapbx") {
        // Use our backend proxy for SANPBX termination
        const token = sessionStorage.getItem("clienttoken");
        const resp = await fetch(`${API_BASE}/series-campaign/terminate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            agentId,
            provider: "sanpbx",
            callid,
            uniqueId,
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data.success === false)
          throw new Error(data.error || "Failed to terminate SANPBX call");
      } else {
        // As a safe fallback, attempt czentrix termination with uniqueId via backend
        const token = sessionStorage.getItem("clienttoken");
        const resp = await fetch(`${API_BASE}/series-campaign/terminate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ agentId, provider: "czentrix", uniqueId }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data.success === false)
          throw new Error(data.error || "Failed to terminate call");
      }
      try {
        toast.success("Call termination requested");
      } catch {}
      // Stop polling and close modal after termination request
      stopLiveCallPolling();
      setShowLiveCallModal(false);
    } catch (e) {
      console.error("Terminate call failed:", e);
      try {
        toast.error(e?.message || "Failed to terminate call");
      } catch {}
    }
  };
  const handleViewLiveCall = (call) => {
    console.log("Opening live call modal for:", call);
    setSelectedCall(call);
    setShowLiveCallModal(true);
    // Start polling for live logs if uniqueId exists
    if (call.metadata?.customParams?.uniqueid) {
      console.log(
        "Starting live polling for uniqueId:",
        call.metadata.customParams.uniqueid
      );
      startLiveCallPolling(call.metadata.customParams.uniqueid);
    } else {
      console.log("No uniqueId found in call data");
    }
  };
  const closeLiveCallModal = () => {
    setShowLiveCallModal(false);
    setSelectedCall(null);
    stopLiveCallPolling();
    setLiveTranscript("");
    setLiveTranscriptLines([]);
    setLiveCallDetails(null);
    setCallConnectionStatus("connected");
  };
  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (logsPollRef.current) {
        clearTimeout(logsPollRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);
  // Removed periodic auto-refresh of campaign calling status; refresh manually via button
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "expired":
        return "bg-red-100 text-red-700";
      case "draft":
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  if (loading && !campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading campaign details...</span>
      </div>
    );
  }
  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">Campaign not found</div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 shadow-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Campaigns
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {campaign.name}
                </h1>
                <p className="text-gray-600 mt-1">{campaign.description}</p>
                {/* Calling Mode compact badge (P/S) */}
                <div className="mt-2 flex items-center"></div>
              </div>
            </div>
            <button></button>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">
                Created{" "}
                {new Date(campaign.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Minimal Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              {/* Run / Stop toggle (small) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleCampaignCalling}
                  disabled={
                    isTogglingCampaign ||
                    (!campaign?.isRunning && (
                      !campaignGroups ||
                      campaignGroups.length === 0 ||
                      !Array.isArray(campaign?.agent) ||
                      campaign.agent.length === 0
                    ))
                  }
                  title={
                    campaign?.isRunning
                      ? "Stop campaign"
                      : !campaignGroups || campaignGroups.length === 0
                      ? "Cannot start: No groups assigned"
                      : !Array.isArray(campaign?.agent) ||
                        campaign.agent.length === 0
                      ? "Cannot start: No agent assigned"
                      : "Start campaign"
                  }
                  className={`inline-flex items-center justify-center h-9 p-2 border rounded-md border-gray-200 transition-colors ${
                    isTogglingCampaign ||
                    (!campaign?.isRunning && (
                      !campaignGroups ||
                      campaignGroups.length === 0 ||
                      !Array.isArray(campaign?.agent) ||
                      campaign.agent.length === 0
                    ))
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : campaign?.isRunning
                      ? "bg-red-100 border-red-600 text-red-800 hover:bg-red-200"
                      : "bg-green-100 border-green-600 text-green-800 hover:bg-green-200"
                  }`}
                >
                  {isTogglingCampaign ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span className="mx-2 text-lg text-gray-600">
                        {campaign?.isRunning ? "Stopping..." : "Starting..."}
                      </span>
                    </>
                  ) : (
                    <>
                      {campaign?.isRunning ? (
                        <FiPause className="w-4 h-4" />
                      ) : (
                        <FiPlay className="w-4 h-4" />
                      )}
                      <span className="mx-2 text-lg text-gray-600">
                        {campaign?.isRunning ? "Stop" : "Run"}
                      </span>
                    </>
                  )}
                </button>
              </div>
              {/* Add buttons */}
              <div className="flex items-center gap-2">
                {Array.isArray(selectedRangesDisplay) && selectedRangesDisplay.length > 0 && (
                  <div className="mr-4 text-right">
                    <div className="text-xs text-gray-500">Selected range</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {selectedRangesDisplay[selectedRangesDisplay.length - 1].groupName}: {selectedRangesDisplay[selectedRangesDisplay.length - 1].start}-{selectedRangesDisplay[selectedRangesDisplay.length - 1].end}
                    </div>
                  </div>
                )}
                <div className="mb-2 text-sm text-gray-700 flex items-center gap-4">
                  {Array.isArray(campaign?.agent) &&
                    campaign.agent.length > 0 && (
                      <span className="items-center gap-1">
                        <span className="font-medium">
                          {(() => {
                            const agentId = getPrimaryAgentId();
                            return agentId
                              ? agentMap[agentId] || "Loading..."
                              : "";
                          })()}
                        </span>
                      </span>
                    )}
                </div>
                <button
                  onClick={() => {
                    setShowAddAgentModal(true);
                    if (!agents || agents.length === 0) {
                      fetchAgents();
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <FiUserPlus className="w-4 h-4 mr-1.5" /> Add AI Agent
                </button>
              </div>
            </div>
          </div>
          {/* Small cards for current groups */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium text-gray-900">
                Contact Groups
              </h2>
              <button
                onClick={() => setShowAddGroupsModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FiPlus className="w-4 h-4 mr-1.5" /> Add Group
              </button>
            </div>
            {campaignGroups && campaignGroups.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                {campaignGroups.map((group) => (
                  <div
                    key={`status-chip-${group._id}`}
                    className="cursor-pointer inline-flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => openGroupRangeModal(group._id)}
                      className="text-left cursor-pointer"
                      title="View contacts and select range"
                    >
                      <div className="cursor-pointer text-sm font-semibold text-gray-800 leading-5">
                        {group.name}
                      </div>
                      <div className=" cursor-pointer text-xs text-gray-500 leading-4">
                        {(() => {
                          const total = (typeof group.contactsCount === "number" ? group.contactsCount : (group.contacts?.length || 0));
                          const sel = Array.isArray(campaign?.groupSelections)
                            ? campaign.groupSelections.find((gs) => String(gs.groupId) === String(group._id))
                            : null;
                          let bracket = "";
                          if (sel) {
                            if (Array.isArray(sel.selectedIndices) && sel.selectedIndices.length > 0) {
                              const minIdx = Math.min(...sel.selectedIndices);
                              const maxIdx = Math.max(...sel.selectedIndices);
                              const humanStart = (Number.isFinite(minIdx) ? minIdx + 1 : 1);
                              const humanEnd = (Number.isFinite(maxIdx) ? maxIdx + 1 : 0);
                              bracket = humanEnd > 0 ? ` (${humanStart}-${humanEnd})` : "";
                            } else if (Number.isFinite(sel.startIndex) && Number.isFinite(sel.endIndex) && sel.endIndex > sel.startIndex) {
                              const humanStart = sel.startIndex + 1;
                              const humanEnd = sel.endIndex;
                              bracket = ` (${humanStart}-${humanEnd})`;
                            }
                          }
                          return (
                            <>
                              {total} contacts{bracket}
                            </>
                          );
                        })()}
                      </div>
                    </button>
                    <button
                      type="button"
                      title="Remove group"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleRemoveGroup(group._id)}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Campaign Progress Section - Always Visible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-base font-medium text-gray-900">
                  Campaign Summary
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    campaign?.isRunning
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-50 text-gray-600 border border-gray-200"
                  }`}
                >
                  {campaign?.isRunning ? "🟢 Running" : "⚪ Not Running"}
                </span>
                {campaign?.isRunning && campaignStartTime && (
                  <div className="ml-3 flex items-center space-x-3 text-xs text-gray-600">
                    <span>
                      <strong>Start:</strong>{" "}
                      {new Date(campaignStartTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span>
                      <strong>Duration:</strong> {formatHMSCompact(runSeconds)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between space-x-2">
                <button
                  onClick={() => setStatusLogsCollapsed((v) => !v)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md border border-gray-200"
                  title={statusLogsCollapsed ? "Expand" : "Collapse"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${
                      statusLogsCollapsed ? "transform rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.094l3.71-3.864a.75.75 0 011.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0l-4.24-4.41a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {/* Compact calling mode badge next to arrow */}
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    agentConfigMode === "serial"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                  title={agentConfigMode === "serial" ? "Serial" : "Parallel"}
                >
                  {agentConfigMode === "serial" ? "S" : "P"}
                </span>
              </div>
            </div>
            {/* Metrics Grid */}
            <div
              className={`grid grid-cols-6 gap-4 mb-4 ${
                statusLogsCollapsed ? "hidden" : ""
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {apiMergedCallsLoading && apiMergedCallsInitialLoad ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    (() => {
                      const total = Array.isArray(campaignContacts)
                        ? campaignContacts.length
                        : 0;
                      const callsMade = Math.min(
                        total,
                        apiMergedCallsTotals.totalItems
                      );
                      return `${callsMade || 0} / ${total || 0}`;
                    })()
                  )}
                </div>
                <div className="text-xs text-gray-500">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-amber-600">
                  {apiMergedCallsLoading && apiMergedCallsInitialLoad ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                    </div>
                  ) : (
                    apiMergedCallsTotals.totalRinging || 0
                  )}
                </div>
                <div className="text-xs text-gray-500">Ringing</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {apiMergedCallsLoading && apiMergedCallsInitialLoad ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    apiMergedCallsTotals.totalOngoing || 0
                  )}
                </div>
                <div className="text-xs text-gray-500">Ongoing</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {apiMergedCallsLoading && apiMergedCallsInitialLoad ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    apiMergedCallsTotals.totalConnected
                  )}
                </div>
                <div className="text-xs text-gray-500">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {apiMergedCallsLoading && apiMergedCallsInitialLoad ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                    </div>
                  ) : (
                    apiMergedCallsTotals.totalMissed
                  )}
                </div>
                <div className="text-xs text-gray-500">Not Connected</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {apiMergedCallsLoading && apiMergedCallsInitialLoad ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    formatHMSCompact(apiMergedCallsTotals.totalDuration)
                  )}
                </div>
                <div className="text-xs text-gray-500">Total Duration</div>
              </div>
            </div>
            {/* Progress Bar */}
            <div className={`mb-3 ${statusLogsCollapsed ? "hidden" : ""}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700">
                  Progress Bar
                </span>
                <span className="text-xs text-gray-500">
                  {apiMergedCallsLoading && apiMergedCallsInitialLoad ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></div>
                      Loading stats...
                    </div>
                  ) : (
                    (() => {
                      const total = Array.isArray(campaignContacts)
                        ? campaignContacts.length
                        : 0;
                      return `${apiMergedCallsTotals.totalConnected} Connected, ${apiMergedCallsTotals.totalMissed} Not Connected of ${total} total`;
                    })()
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (() => {
                      const total = Array.isArray(campaignContacts)
                        ? campaignContacts.length
                        : 0;
                      const callsMade = Math.min(
                        total,
                        apiMergedCallsTotals.totalItems
                      );
                      return total > 0 && callsMade > 0;
                    })()
                      ? "bg-gradient-to-r from-green-400 to-green-500"
                      : "bg-gray-300"
                  }`}
                  style={{
                    width: (() => {
                      const total = Array.isArray(campaignContacts)
                        ? campaignContacts.length
                        : 0;
                      if (total === 0) return "0%";
                      const callsMade = Math.min(
                        total,
                        apiMergedCallsTotals.totalItems
                      );
                      const pct = Math.max((callsMade / total) * 100, 0);
                      return `${pct}%`;
                    })(),
                  }}
                ></div>
              </div>
            </div>
            {callingStatus === "paused" && (
              <div className="text-xs text-yellow-700 text-center py-2 bg-yellow-50 rounded-md border border-yellow-200">
                Calling paused - resume anytime
              </div>
            )}
            {callingStatus === "completed" && (
              <div className="text-xs text-blue-700 text-center py-2 bg-blue-50 rounded-md border border-blue-200">
                All calls completed successfully
              </div>
            )}
            {/* Campaign Requirements Check */}
            {(!campaignGroups || campaignGroups.length === 0) && (
              <div className="text-xs text-red-700 text-center py-2 bg-red-50 rounded-md border border-red-200">
                ⚠️ Campaign cannot run: No groups assigned. Please add groups
                first.
              </div>
            )}
            {campaignGroups &&
              campaignGroups.length > 0 &&
              (!Array.isArray(campaign?.agent) ||
                campaign.agent.length === 0) && (
                <div className="text-xs text-red-700 text-center py-2 bg-red-50 rounded-md border border-red-200">
                  ⚠️ Campaign cannot run: No agent assigned. Please add an agent
                  first.
                </div>
              )}
            {campaignGroups &&
              campaignGroups.length > 0 &&
              Array.isArray(campaign?.agent) &&
              campaign.agent.length > 0 &&
              (!campaignContacts || campaignContacts.length === 0) && (
                <div className="text-xs text-orange-700 text-center py-2 bg-orange-50 rounded-md border border-orange-200">
                  ⚠️ Campaign cannot run: No contacts available. Please sync
                  contacts from groups first.
                </div>
              )}
          </div>
          {/* Campaign Progress Section - Always Visible */}
          {/* Group Range Modal */}
          {showGroupRangeModal && rangeModalGroup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowGroupRangeModal(false)}
              ></div>
              <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl mx-4 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {rangeModalGroup.name} —{" "}
                    {typeof rangeModalGroup.contactsCount === "number"
                      ? rangeModalGroup.contactsCount
                      : rangeModalGroup.contacts?.length || 0}{" "}
                    contacts
                  </h3>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowGroupRangeModal(false)}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-200">
                    <button
                      className={`px-3 py-2 text-sm ${
                        groupModalTab === "range"
                          ? "border-b-2 border-blue-600 text-blue-700"
                          : "text-gray-600"
                      }`}
                      onClick={() => setGroupModalTab("range")}
                    >
                      Range
                    </button>
                    <button
                      className={`px-3 py-2 text-sm ${
                        groupModalTab === "select"
                          ? "border-b-2 border-blue-600 text-blue-700"
                          : "text-gray-600"
                      }`}
                      onClick={() => setGroupModalTab("select")}
                    >
                      Select & Call
                    </button>
                  </div>
                  {groupModalTab === "range" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Start from
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(
                            0,
                            rangeModalGroup.contacts?.length || 0
                          )}
                          value={rangeStartIndex}
                          onChange={(e) => setRangeStartIndex(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          End at (exclusive)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(
                            0,
                            rangeModalGroup.contacts?.length || 0
                          )}
                          value={rangeEndIndex}
                          onChange={(e) => setRangeEndIndex(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        />
                      </div>
                    </div>
                  )}
                  {groupModalTab === "select" && (
                    <div className="max-h-60 overflow-auto border rounded-md">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">
                              <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={
                                  Array.isArray(selectedContactIndices) &&
                                  rangeModalGroup.contacts &&
                                  selectedContactIndices.length ===
                                    rangeModalGroup.contacts.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const total =
                                      rangeModalGroup.contacts?.length || 0;
                                    setSelectedContactIndices(
                                      Array.from({ length: total }, (_, i) => i)
                                    );
                                    if (groupModalTab === "range") {
                                      setRangeStartIndex(1);
                                      setRangeEndIndex(total);
                                    }
                                  } else {
                                    setSelectedContactIndices([]);
                                  }
                                }}
                                title="Select All"
                              />
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">
                              #
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">
                              Name
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">
                              Phone
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">
                              Email
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(rangeModalGroup.contacts || []).map((c, idx) => (
                            <tr
                              key={idx}
                              className={`${
                                groupModalTab === "range" &&
                                idx >= rangeStartIndex &&
                                idx < rangeEndIndex
                                  ? "bg-green-50"
                                  : ""
                              }`}
                            >
                              <td className="px-3 py-1">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4"
                                  checked={selectedContactIndices.includes(idx)}
                                  onChange={(e) => {
                                    setSelectedContactIndices((prev) => {
                                      const set = new Set(prev);
                                      if (e.target.checked) set.add(idx);
                                      else set.delete(idx);
                                      return Array.from(set);
                                    });
                                  }}
                                  title="Select contact"
                                />
                              </td>
                              <td className="px-3 py-1 text-gray-600">{idx}</td>
                              <td className="px-3 py-1">{c.name || ""}</td>
                              <td className="px-3 py-1">{c.phone}</td>
                              <td className="px-3 py-1">{c.email || ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                    onClick={() => setShowGroupRangeModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={rangeModalLoading}
                    onClick={saveGroupRangeToCampaign}
                  >
                    {rangeModalLoading
                      ? "Saving..."
                      : groupModalTab === "select"
                      ? "Add to Campaign"
                      : "Add to Campaign"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Live call logs (Ringing/Ongoing) - show only in NGR/parallel mode */}
          {true && (
            <div
              className={`bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-2xl shadow border border-blue-200 p-6 mb-8 ring-1 ring-blue-100 ${
                statusLogsCollapsed ? "hidden" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700">●</span>
                  Live call logs
                </h2>
                <div className="flex items-center gap-3">
                  {/* Auto refresh toggle (same visual) */}
                  <label className="flex items-center gap-2 text-sm select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={autoRefreshCalls}
                      onChange={(e) => setAutoRefreshCalls(e.target.checked)}
                    />
                    {autoRefreshCalls
                      ? "Auto-refresh: On"
                      : "Auto-refresh: Off"}
                  </label>
                  <button
                    onClick={() => fetchApiMergedCalls(1, false, false)}
                    className="text-sm px-2 py-1 bg-gray-50 text-black rounded-md hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-between"
                    title="Refresh"
                  >
                    <svg
                      className="w-3 h-3 mx-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Refresh</span>
                  </button>
                  {/* Visual parity selects (disabled for live) */}
                  <select
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 opacity-60 cursor-not-allowed"
                    value={callFilter}
                    disabled
                    onChange={() => {}}
                  >
                    <option>All</option>
                  </select>
                  <select
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 opacity-60 cursor-not-allowed"
                    value={durationSort}
                    disabled
                    onChange={() => {}}
                  >
                    <option>Sort by</option>
                  </select>
                </div>
              </div>
              {apiMergedCallsLoading ? (
                <div className="text-center py-10">Loading live calls...</div>
              ) : (
                (() => {
                  const liveCalls = (apiMergedCalls || []).filter((lead) => {
                    const status = String(lead?.status || "").toLowerCase();
                    return status === "ringing" || status === "ongoing";
                  });
                  if (liveCalls.length === 0) {
                    return (
                      <div className="text-center py-10 text-gray-500">
                        No live calls
                      </div>
                    );
                  }
                  return (
                    <div className="overflow-x-auto">
                      {/* Select and action controls (visual parity with Recent) */}
                      {liveCalls.length > 0 && !apiMergedCallsLoading && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectAllCallLogs}
                                  onChange={handleSelectAllCallLogs}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  Select All Call Logs (
                                  {selectedCallLogs.length} selected)
                                </span>
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={callSelectedCallLogs}
                                disabled={selectedCallLogs.length === 0}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                Call Selected ({selectedCallLogs.length})
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCallLogs([]);
                                  setSelectAllCallLogs(false);
                                }}
                                disabled={selectedCallLogs.length === 0}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Clear Selection
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <table className="min-w-full text-sm border border-amber-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr className="text-left text-gray-700">
                            <th className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={selectAllCallLogs}
                                onChange={handleSelectAllCallLogs}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </th>
                            <th className="py-2 px-3">S. No.</th>
                            <th className="py-2 px-3">Date & Time</th>
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Number</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">
                              <FiClock />
                            </th>
                            <th className="py-2 px-3">Conversation</th>
                            <th className="py-2 px-3">CC</th>
                            <th className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <span>Flag</span>
                                <div className="relative">
                                  <button
                                    type="button"
                                    className={`p-1 rounded border ${
                                      flagFilter !== "all"
                                        ? "bg-yellow-100 border-yellow-300"
                                        : "bg-white border-gray-300 hover:bg-gray-50"
                                    }`}
                                    title="Filter by flag"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newState = !flagMenuOpen;
                                if (newState) {
                                  const position = calculateDropdownPosition(e.target.closest('button'));
                                  console.log('Setting flag menu position to:', position);
                                  setFlagMenuPosition(position);
                                }
                                setFlagMenuOpen(newState);
                                    }}
                                  >
                                    {/* small flag icon */}
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 text-gray-700"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6v14M4 6h12l-3 4 3 4H4"
                                      />
                                    </svg>
                                  </button>
                                  {flagMenuOpen && (
                                    <div
                                      className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg z-[100] p-2"
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {(() => {
                                        // compute visible rows' flag options
                                        const visible = (run.contacts || []).filter((lead, idx) => {
                                          const name = (lead.name || "").toString().trim();
                                          const number = (lead.number || lead.phone || "")
                                            .toString()
                                            .trim();
                                          const hasRealName = name && name !== "-";
                                          const hasRealNumber = number && number !== "-" && /\d/.test(number);
                                          const byData = hasRealName || hasRealNumber;
                                          const status = (lead.status || "").toLowerCase();
                                          const connectedStatuses = ["connected", "completed", "ongoing"];
                                          const missedStatuses = ["missed", "not_connected", "failed"];
                                          if (agentConfigMode !== "serial") {
                                            const isLive = status === "ringing" || status === "ongoing";
                                            if (isLive) return false;
                                          }
                                          const byStatus =
                                            callFilter === "all"
                                              ? true
                                              : callFilter === "connected"
                                              ? connectedStatuses.includes(status)
                                              : missedStatuses.includes(status);
                                          const rowId = `${run.instanceNumber || run._id || index}-${
                                            lead.documentId || lead.contactId || `${idx}`
                                          }`;
                                          const selectedFlag = rowDisposition[rowId];
                                          const byFlag =
                                            flagFilter === "all"
                                              ? true
                                              : flagFilter === "unlabeled"
                                              ? !selectedFlag
                                              : selectedFlag === flagFilter;
                                          const leadDisposition = (lead.leadStatus || lead.disposition || "").toLowerCase();
                                          const byDisposition =
                                            dispositionFilter === "all" ? true : leadDisposition === dispositionFilter;
                                          return byData && byStatus && byFlag && byDisposition;
                                        });
                                        const set = new Set();
                                        for (let i = 0; i < visible.length; i++) {
                                          const lead = visible[i];
                                          const rowId = `${run.instanceNumber || run._id || index}-${
                                            lead.documentId || lead.contactId || `${i}`
                                          }`;
                                          const val = rowDisposition[rowId];
                                          set.add(val || "unlabeled");
                                        }
                                        const options = Array.from(set);
                                        return (
                                          <div className="py-1">
                                            {options.length === 0 ? (
                                              <div className="px-3 py-2 text-sm text-gray-500">No flags</div>
                                            ) : (
                                              options.map((opt) => (
                                                <button
                                                  key={opt}
                                                  data-filter-button
                                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                                                    (opt === "unlabeled" ? "unlabeled" : opt) === flagFilter ? "bg-yellow-50" : ""
                                                  }`}
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const next = (opt === "unlabeled" ? "unlabeled" : opt) === flagFilter ? "all" : (opt === "unlabeled" ? "unlabeled" : opt);
                                                    setFlagFilter(next);
                                                    setFlagMenuOpen(false);
                                                  }}
                                                >
                                                  {opt === "unlabeled" ? "Unlabeled" : opt}
                                                </button>
                                              ))
                                            )}
                                            <div className="border-t border-gray-100 my-1" />
                                            <button
                                              data-filter-button
                                              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setFlagFilter("all");
                                                setFlagMenuOpen(false);
                                              }}
                                            >
                                              Clear
                                            </button>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </th>
                            <th className="py-2 px-3">Disposition</th>
                            <th className="py-2 px-3">Action</th>
                            <th className="py-2 px-3">Redial</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {liveCalls.map((lead, idx) => (
                            <tr
                              key={`${
                                lead.documentId || lead.contactId || "live"
                              }-${idx}`}
                              className={`transition-colors ${
                                String(lead.status).toLowerCase() === "ringing"
                                  ? "bg-yellow-50 hover:bg-yellow-100 ring-1 ring-yellow-300"
                                  : "bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200"
                              } ${isCallLogSelected(lead) ? 'ring-2 ring-blue-300' : ''}`}
                              style={{ borderLeft: "4px solid", borderLeftColor: String(lead.status).toLowerCase() === "ringing" ? "#f59e0b" : "#3b82f6" }}
                            >
                              <td className="py-2 px-3">
                                <input
                                  type="checkbox"
                                  checked={isCallLogSelected(lead)}
                                  onChange={() => handleSelectCallLog(lead)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2 px-3 text-gray-700">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 text-gray-700 flex flex-col items-center gap-2">
                                <span>
                                  {lead.time
                                    ? new Date(lead.time).toLocaleDateString()
                                    : "-"}{" "}
                                </span>
                                <span>
                                  {lead.time
                                    ? new Date(lead.time).toLocaleTimeString(
                                        [],
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )
                                    : "-"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-gray-700">
                                {lead.name || "-"}
                              </td>
                              <td className="py-2 px-3 text-gray-700">
                                {lead.number || "-"}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    String(lead.status || "").toLowerCase() ===
                                    "ringing"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {String(lead.status || "").toUpperCase()}
                                </span>
                              </td>
                              {/* Duration (⏱) */}
                              <td className="py-2 px-3">
                                {formatDuration(lead.duration)}
                              </td>
                              {/* Conversation (Transcript) button - mirrors recent style */}
                              <td className="py-2 px-3">
                                <button
                                  className={`text-xs px-2 py-1 rounded-md border ${
                                    lead.documentId &&
                                    viewedTranscripts.has(lead.documentId)
                                      ? "bg-green-50 text-fuchsia-700 border-green-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                  }`}
                                  title={
                                    lead.documentId &&
                                    viewedTranscripts.has(lead.documentId)
                                      ? "Transcript viewed"
                                      : "View transcript"
                                  }
                                  onClick={() => openTranscriptSmart(lead)}
                                >
                                  <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8M8 12h8M8 8h8M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H7l-2 2H3v12a2 2 0 002 2z"/></svg>
                                  {(() => {
                                    const baseLabel =
                                      lead.documentId &&
                                      viewedTranscripts.has(lead.documentId)
                                        ? "Viewed"
                                        : "Transcript";
                                    const count =
                                      (typeof lead.transcriptCount === "number"
                                        ? lead.transcriptCount
                                        : undefined) ??
                                      getTranscriptMessageCount(lead);
                                    return count > 0
                                      ? `${baseLabel} (${count})`
                                      : baseLabel;
                                  })()}
                                </button>
                              </td>
                              {/* CC: conversation count column */}
                              <td className="py-2 px-3 text-gray-700">
                                {(() => {
                                  const count =
                                    (typeof lead.transcriptCount === "number"
                                      ? lead.transcriptCount
                                      : undefined) ?? getTranscriptMessageCount(lead);
                                  return Number(count) || 0;
                                })()}
                              </td>
                              {/* Flag (WhatsApp mini chat indicator, same as Recent) */}
                              <td className="py-2 px-3 text-gray-700">
                                {lead.whatsappRequested &&
                                lead.whatsappMessageSent ? (
                                  <button
                                    type="button"
                                    onClick={() => openWhatsAppMiniChat(lead)}
                                    title="Open WhatsApp chat"
                                    className="inline-flex items-center justify-center"
                                  >
                                    <FaWhatsapp className="w-4 h-4 text-green-600" />
                                  </button>
                                ) : (
                                  ""
                                )}
                              </td>
                              {/* Disposition disabled for live logs */}
                              <td className="py-2 px-3"></td>
                              {/* Action */}
                              <td className="py-2 px-3">
                                {(() => {
                                  const rowId = (lead.documentId || lead.contactId || `${idx}`);
                                  const key = `assign-${rowId}`;
                                  return (
                                    <div className="relative">
                                      <button
                                        type="button"
                                        className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-gray-50"
                                        title="Assign"
                                        onClick={(e) => { e.stopPropagation(); setOpenAssignFor(openAssignFor === key ? null : key); }}
                                      >
                                        Assign ▾
                                      </button>
                                      {openAssignFor === key && (
                                        <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded shadow z-10">
                                          {["t1","t2","t3","t4","t5"].map((tag) => (
                                            <button
                                              key={tag}
                                              type="button"
                                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                                              onClick={(e) => { e.stopPropagation(); setRowAssignments((prev) => ({ ...prev, [rowId]: tag })); setOpenAssignFor(null); }}
                                            >
                                              {tag.toUpperCase()}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="py-2 px-3">
                                <button
                                  className="inline-flex items-center px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={
                                    !lead.number
                                      ? "No phone number available"
                                      : lead.status === "ringing" ||
                                        lead.status === "ongoing"
                                      ? "Call already in progress"
                                      : "Retry this contact"
                                  }
                                  onClick={() => handleRetryLead(lead)}
                                  disabled={
                                    !lead.number ||
                                    lead.status === "ringing" ||
                                    lead.status === "ongoing"
                                  }
                                >
                                  <FiPhone
                                    className="w-3 h-3 text-green-700 mx-2"
                                    style={{
                                      minWidth: "16px",
                                      minHeight: "16px",
                                    }}
                                  />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
            </div>
          )}
          {/* Minimal Leads + Transcript Section */}
          <div
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 ${
              statusLogsCollapsed ? "hidden" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-gray-900">
                Recent call logs
              </h2>
              <div className="flex items-center gap-3">
                {/* Auto refresh toggle */}
                <label className="flex items-center gap-2 text-sm select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={autoRefreshCalls}
                    onChange={(e) => setAutoRefreshCalls(e.target.checked)}
                  />
                  {autoRefreshCalls ? "Auto-refresh: On" : "Auto-refresh: Off"}
                </label>
                <button
                  onClick={() => fetchApiMergedCalls(1, false, false)}
                  className="text-sm px-2 py-1 bg-gray-50 text-black rounded-md hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-between"
                  title="Refresh"
                >
                  <svg
                    className="w-3 h-3 mx-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Refresh</span>
                </button>
                <select
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  value={callFilter}
                  onChange={(e) => setCallFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="connected">Connected</option>
                  <option value="missed">Not Connected</option>
                </select>
                <select
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  value={durationSort}
                  onChange={(e) => setDurationSort(e.target.value)}
                >
                  <option value="none">Sort by</option>
                  <option value="longest">Longest First</option>
                  <option value="shortest">Shortest First</option>
                </select>
                {callFilter === "missed" && (
                  <button
                    className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    onClick={() => {
                      callMissedCalls();
                    }}
                    disabled={
                      apiMergedCallsLoading ||
                      !campaignGroups ||
                      campaignGroups.length === 0
                    }
                    title={
                      !campaignGroups || campaignGroups.length === 0
                        ? "No groups assigned to campaign"
                        : "Call all not connected contacts"
                    }
                  >
                    Call Again
                  </button>
                )}
              </div>
            </div>
            {/* Select and Call Controls for Call Logs */}
            {apiMergedCalls.length > 0 && !apiMergedCallsLoading && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectAllCallLogs}
                        onChange={handleSelectAllCallLogs}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Select All Call Logs ({selectedCallLogs.length}{" "}
                        selected)
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={callSelectedCallLogs}
                      disabled={selectedCallLogs.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Call Selected ({selectedCallLogs.length})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCallLogs([]);
                        setSelectAllCallLogs(false);
                      }}
                      disabled={selectedCallLogs.length === 0}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}
            {apiMergedCallsLoading ? (
              <div className="text-center py-10">Loading call logs...</div>
            ) : apiMergedCalls.length === 0 ? (
              <div className="text-center py-16 px-8 bg-gray-50 rounded-lg border border-gray-200 mx-4 my-6">
                <div className="text-gray-500 text-lg font-medium mb-2">
                  No call logs found
                </div>
                <div className="text-gray-400 text-sm">
                  Call logs will appear here once calls are made
                </div>
              </div>
            ) : (
              <div className="">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg mb-5 z-10">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-left text-gray-700">
                      <th className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={selectAllCallLogs}
                          onChange={handleSelectAllCallLogs}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="py-2 px-3">S. No.</th>
                      <th className="py-2 px-3">Date & Time</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Number</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">
                        <FiClock />
                      </th>
                      <th className="py-2 px-3">Conversation</th>
                      <th className="py-2 px-3">CC</th>
                      <th className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span>Flag</span>
                          <div className="relative">
                            <button
                              type="button"
                              className={`p-1 rounded border ${
                                flagFilter !== "all"
                                  ? "bg-yellow-100 border-yellow-300"
                                  : "bg-white border-gray-300 hover:bg-gray-50"
                              }`}
                              title="Filter by flag"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newState = !flagMenuOpen;
                                if (newState) {
                                  const position = calculateDropdownPosition(e.target.closest('button'));
                                  console.log('Setting flag menu position to:', position);
                                  setFlagMenuPosition(position);
                                }
                                setFlagMenuOpen(newState);
                              }}
                            >
                              {/* small flag icon */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-gray-700"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 6v14M4 6h12l-3 4 3 4H4"
                                />
                              </svg>
                            </button>
                            {flagMenuOpen && (
                              <div
                                className={`absolute right-0 w-44 bg-white border border-gray-200 rounded shadow-lg z-[100] p-2 min-h-[100px] ${
                                  flagMenuPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
                                }`}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  backgroundColor: flagMenuPosition === "top" ? "#fef3c7" : "#ffffff",
                                  border: flagMenuPosition === "top" ? "2px solid #f59e0b" : "1px solid #e5e7eb"
                                }}
                              >
                                {(() => {
                                  // compute visible rows' flag options
                                  const visible = (run.contacts || []).filter((lead, idx) => {
                                    const name = (lead.name || "").toString().trim();
                                    const number = (lead.number || lead.phone || "")
                                      .toString()
                                      .trim();
                                    const hasRealName = name && name !== "-";
                                    const hasRealNumber = number && number !== "-" && /\d/.test(number);
                                    const byData = hasRealName || hasRealNumber;
                                    const status = (lead.status || "").toLowerCase();
                                    const connectedStatuses = ["connected", "completed", "ongoing"];
                                    const missedStatuses = ["missed", "not_connected", "failed"];
                                    if (agentConfigMode !== "serial") {
                                      const isLive = status === "ringing" || status === "ongoing";
                                      if (isLive) return false;
                                    }
                                    const byStatus =
                                      callFilter === "all"
                                        ? true
                                        : callFilter === "connected"
                                        ? connectedStatuses.includes(status)
                                        : missedStatuses.includes(status);
                                    const rowId = `${run.instanceNumber || run._id || index}-${
                                      lead.documentId || lead.contactId || `${idx}`
                                    }`;
                                    const selectedFlag = rowDisposition[rowId];
                                    const byFlag =
                                      flagFilter === "all"
                                        ? true
                                        : flagFilter === "unlabeled"
                                        ? !selectedFlag
                                        : selectedFlag === flagFilter;
                                    const leadDisposition = (lead.leadStatus || lead.disposition || "").toLowerCase();
                                    const byDisposition =
                                      dispositionFilter === "all" ? true : leadDisposition === dispositionFilter;
                                    return byData && byStatus && byFlag && byDisposition;
                                  });
                                  const set = new Set();
                                  for (let i = 0; i < visible.length; i++) {
                                    const lead = visible[i];
                                    const rowId = `${run.instanceNumber || run._id || index}-${
                                      lead.documentId || lead.contactId || `${i}`
                                    }`;
                                    const val = rowDisposition[rowId];
                                    set.add(val || "unlabeled");
                                  }
                                  const options = Array.from(set);
                                  return (
                                    <div className="py-1">
                                      {options.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">No flags</div>
                                      ) : (
                                        options.map((opt) => (
                                          <button
                                            key={opt}
                                            data-filter-button
                                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                                              (opt === "unlabeled" ? "unlabeled" : opt) === flagFilter ? "bg-yellow-50" : ""
                                            }`}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const next = (opt === "unlabeled" ? "unlabeled" : opt) === flagFilter ? "all" : (opt === "unlabeled" ? "unlabeled" : opt);
                                              setFlagFilter(next);
                                              setFlagMenuOpen(false);
                                            }}
                                          >
                                            {opt === "unlabeled" ? "Unlabeled" : opt}
                                          </button>
                                        ))
                                      )}
                                      <div className="border-t border-gray-100 my-1" />
                                      <button
                                        data-filter-button
                                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setFlagFilter("all");
                                          setFlagMenuOpen(false);
                                        }}
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </th>
                      <th className="py-2 px-3">Disposition</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Redial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(() => {
                      const filteredCalls = apiMergedCalls.filter((lead) => {
                        const name = (lead.name || "").toString().trim();
                        const number = (lead.number || "").toString().trim();
                        const hasRealName = name && name !== "-";
                        const hasRealNumber =
                          number && number !== "-" && /\d/.test(number);
                        const byData = hasRealName || hasRealNumber;
                        const status = (lead.status || "").toLowerCase();
                        const connectedStatuses = ["connected", "completed"];
                        const missedStatuses = [
                          "missed",
                          "not_connected",
                          "failed",
                        ];
                        const notLive =
                          status !== "ringing" && status !== "ongoing";
                        const byStatus =
                          callFilter === "all"
                            ? status === "completed" ||
                              missedStatuses.includes(status)
                            : callFilter === "connected"
                            ? connectedStatuses.includes(status)
                            : missedStatuses.includes(status);
                        return byData && byStatus && notLive;
                      });
                      if (filteredCalls.length === 0) {
                        return (
                          <tr>
                            <td colSpan="12" className="text-center py-16 px-8">
                              <div className="bg-gray-50 rounded-lg border border-gray-200 mx-4 my-6 py-8">
                                <div className="text-gray-500 text-lg font-medium mb-2">
                                  No results found
                                </div>
                                <div className="text-gray-400 text-sm">
                                  Try adjusting your filters to see more results
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return filteredCalls
                        .sort((a, b) => {
                        if (durationSort === "none") return 0;
                        // Convert duration to seconds for comparison
                        const getDurationInSeconds = (lead) => {
                          const duration = lead.duration;
                          // Handle different duration formats
                          if (!duration) return 0;
                          // Convert to string if it's not already
                          const durationStr = String(duration);
                          // Handle MM:SS format
                          if (durationStr.includes(":")) {
                            const parts = durationStr.split(":");
                            if (parts.length === 2) {
                              const minutes = parseInt(parts[0]) || 0;
                              const seconds = parseInt(parts[1]) || 0;
                              return minutes * 60 + seconds;
                            }
                          }
                          // Handle pure number (assume seconds)
                          const numDuration = parseInt(durationStr);
                          if (!isNaN(numDuration)) {
                            return numDuration;
                          }
                          return 0;
                        };
                        const durationA = getDurationInSeconds(a);
                        const durationB = getDurationInSeconds(b);
                        if (durationSort === "longest") {
                          return durationB - durationA; // Descending order
                        } else if (durationSort === "shortest") {
                          return durationA - durationB; // Ascending order
                        }
                        return 0;
                      })
                      .map((lead, idx) => (
                        <tr
                          key={`${
                            lead.documentId || lead.contactId || "row"
                          }-${idx}`}
                          className={`hover:bg-gray-50 ${
                            isCallLogSelected(lead)
                              ? "bg-blue-50 border-blue-200"
                              : ""
                          }`}
                        >
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={isCallLogSelected(lead)}
                              onChange={() => handleSelectCallLog(lead)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-gray-700">{idx + 1}</td>
                          <td className="py-2 px-3 text-gray-700 flex flex-col items-center gap-2">
                            <span>
                              {lead.time
                                ? new Date(lead.time).toLocaleDateString()
                                : "-"}{" "}
                            </span>
                            <span>
                              {lead.time
                                ? new Date(lead.time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-900">
                            {getContactDisplayNameBlank(lead)}
                          </td>
                          <td className="py-2 px-3 text-gray-900">
                            <span className="inline-flex items-center">
                              {redialingCalls.has(
                                lead.documentId || lead.contactId
                              ) ? (
                                <span className="inline-flex items-center text-green-600">
                                  <svg
                                    className="animate-spin h-4 w-4 mr-1"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    ></path>
                                  </svg>
                                  {lead.number || "-"}
                                </span>
                              ) : (
                                lead.number || "-"
                              )}
                            </span>
                          </td>
                          <td className="py-2 px-3 capitalize">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                lead.status === "ringing"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : lead.status === "ongoing"
                                  ? "bg-blue-100 text-blue-700"
                                  : lead.status === "missed" ||
                                    lead.status === "not_connected" ||
                                    lead.status === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {(() => {
                                const s = String(lead.status || "").toLowerCase();
                                if (s === "completed" || s === "connected") return "Connected";
                                if (s === "missed" || s === "not_connected" || s === "failed") return "Not Connected";
                                return lead.status;
                              })()}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {formatDuration(lead.duration)}
                          </td>
                          <td className="py-2 px-3">
                            {lead.status === "missed" ? (
                              <span className="text-gray-400 text-xs text-center"></span>
                            ) : (
                              <button
                                className={`inline-flex items-center px-3 py-1 text-xs border rounded hover:opacity-80 transition-all duration-200 ${
                                  lead.documentId &&
                                  viewedTranscripts.has(lead.documentId)
                                    ? "bg-green-50 text-fuchsia-700 border-green-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                }`}
                                title={
                                  lead.documentId &&
                                  viewedTranscripts.has(lead.documentId)
                                    ? "Transcript viewed"
                                    : "View transcript"
                                }
                                onClick={() => openTranscriptSmart(lead)}
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 16h8M8 12h8M8 8h8M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H7l-2 2H3v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {(() => {
                                  const baseLabel =
                                    lead.documentId &&
                                    viewedTranscripts.has(lead.documentId)
                                      ? "Viewed"
                                      : "Transcript";
                                  const count =
                                    (typeof lead.transcriptCount === "number"
                                      ? lead.transcriptCount
                                      : undefined) ??
                                    getTranscriptMessageCount(lead);
                                  return count > 0
                                    ? `${baseLabel} (${count})`
                                    : baseLabel;
                                })()}
                              </button>
                            )}
                          </td>
                          {/* CC: conversation count column */}
                          <td className="py-2 px-3 text-gray-700">
                            {(() => {
                              const count =
                                (typeof lead.transcriptCount === "number"
                                  ? lead.transcriptCount
                                  : undefined) ?? getTranscriptMessageCount(lead);
                              return Number(count) || 0;
                            })()}
                          </td>
                          <td className="py-2 px-3">
                            {(() => {
                              const rowId =
                                lead.documentId || lead.contactId || `${idx}`;
                              const selected = rowDisposition[rowId];
                              const colorClass =
                                selected === "interested"
                                  ? "bg-green-200 text-green-900 border-green-300"
                                  : selected === "not interested"
                                  ? "bg-red-200 text-red-900 border-red-300"
                                  : selected === "maybe"
                                  ? "bg-yellow-200 text-yellow-900 border-yellow-300"
                                  : "bg-gray-50 text-gray-700 border-gray-200";
                              const label = selected ? selected : "Default";
                              const icon =
                                selected === "interested" ? (
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : selected === "not interested" ? (
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                ) : selected === "maybe" ? (
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                );
                              return (
                                <div className="relative inline-block text-left">
                                  <button
                                    type="button"
                                    className={`inline-flex items-center px-3 py-1 text-xs border rounded ${colorClass}`}
                                    onClick={(e) => {
                                      const direction = calculateDropdownPosition(e.currentTarget);
                                      setRowDispositionPosition((prev) => ({ ...prev, [rowId]: direction }));
                                      setOpenDispositionFor(
                                        openDispositionFor === rowId ? null : rowId
                                      );
                                    }}
                                  >
                                    {icon}
                                    {label}
                                    <svg
                                      className="w-4 h-4 ml-2"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </button>
                                  {openDispositionFor === rowId && (
                                    <div className={`absolute z-10 w-40 bg-white border border-gray-200 rounded shadow ${
                                      (rowDispositionPosition && rowDispositionPosition[rowId]) === "top"
                                        ? "bottom-full mb-1"
                                        : "mt-1"
                                    }`}>
                                      {(agentDispositions.length > 0 ?
                                        agentDispositions.map(disp => {
                                          if (disp.title) {
                                            // Return only main disposition titles, not sub-dispositions
                                            return {
                                              key: disp.title.toLowerCase().replace(/\s+/g, '_'),
                                              label: disp.title,
                                              cls: "text-blue-700",
                                            };
                                          } else if (typeof disp === 'string') {
                                            return {
                                              key: disp.toLowerCase().replace(/\s+/g, '_'),
                                              label: disp,
                                              cls: "text-blue-700",
                                            };
                                          }
                                          return null;
                                        }).filter(Boolean)
                                      : [
                                        {
                                          key: "interested",
                                          label: "Interested",
                                          cls: "text-green-700",
                                        },
                                        {
                                          key: "not interested",
                                          label: "Not Interested",
                                          cls: "text-red-700",
                                        },
                                        {
                                          key: "maybe",
                                          label: "Maybe",
                                          cls: "text-yellow-700",
                                        },
                                        {
                                          key: undefined,
                                          label: "Default",
                                          cls: "text-gray-700",
                                        },
                                      ]).map((opt) => (
                                        <button
                                          key={`${rowId}-${opt.label}`}
                                          type="button"
                                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${opt.cls}`}
                                          onClick={() => {
                                            setRowDisposition((prev) => ({
                                              ...prev,
                                              [rowId]: opt.key,
                                            }));
                                            // Persist to backend
                                            try {
                                              const authToken =
                                                sessionStorage.getItem(
                                                  "clienttoken"
                                                ) ||
                                                localStorage.getItem(
                                                  "admintoken"
                                                );
                                              const url = `${API_BASE}/groups/mark-contact-status`;
                                              const payload = {
                                                campaignId:
                                                  campaign && campaign._id,
                                                phone:
                                                  lead &&
                                                  (lead.number || lead.phone),
                                                status: opt.key || "default",
                                              };
                                              console.log(
                                                "Marking contact status →",
                                                url,
                                                payload
                                              );
                                              fetch(url, {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                  ...(authToken
                                                    ? {
                                                        Authorization: `Bearer ${authToken}`,
                                                      }
                                                    : {}),
                                                },
                                                body: JSON.stringify(payload),
                                              })
                                                .then(async (r) => {
                                                  let body;
                                                  try {
                                                    body = await r.json();
                                                  } catch (e) {}
                                                  console.log(
                                                    "Mark contact status response",
                                                    r.status,
                                                    body
                                                  );
                                                })
                                                .catch((e) => {
                                                  console.warn(
                                                    "Mark contact status failed",
                                                    e
                                                  );
                                                });
                                            } catch (e) {
                                              console.warn(
                                                "Mark contact status exception",
                                                e
                                              );
                                            }
                                            setOpenDispositionFor(null);
                                          }}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-2 px-3">{lead.leadStatus}</td>
                          
                          {/* Action */}
                          <td className="py-2 px-3">
                            {(() => {
                              const rowId = (lead.documentId || lead.contactId || `${idx}`);
                              const key = `assign-${rowId}`;
                              return (
                                <div className="relative">
                                  <button
                                    type="button"
                                    className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-gray-50"
                                    title="Assign"
                                    onClick={(e) => { e.stopPropagation(); setOpenAssignFor(openAssignFor === key ? null : key); }}
                                  >
                                    Assign ▾
                                  </button>
                                  {openAssignFor === key && (
                                    <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded shadow z-10">
                                      {["t1","t2","t3","t4","t5"].map((tag) => (
                                        <button
                                          key={tag}
                                          type="button"
                                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                                          onClick={(e) => { e.stopPropagation(); setRowAssignments((prev) => ({ ...prev, [rowId]: tag })); setOpenAssignFor(null); }}
                                        >
                                          {tag.toUpperCase()}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          {/* Redial */}
                          <td className="py-2 px-3">
                            <button
                              className="inline-flex items-center px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                !lead.number
                                  ? "No phone number available"
                                  : lead.status === "ringing" || lead.status === "ongoing"
                                  ? "Call already in progress"
                                  : "Retry this contact"
                              }
                              onClick={() => handleRetryLead(lead)}
                              disabled={
                                !lead.number ||
                                lead.status === "ringing" ||
                                lead.status === "ongoing"
                              }
                            >
                              <FiPhone
                                className="w-3 h-3 text-green-700 mx-2"
                                style={{ minWidth: "16px", minHeight: "16px" }}
                              />
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Loaded {apiMergedCalls.length} of {apiMergedCallsTotalItems}{" "}
                    items
                  </div>
                  <div className="flex gap-2">
                    {apiMergedCallsLoadingMore && (
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></div>
                        Loading more...
                      </div>
                    )}
                    <button
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                      onClick={() =>
                        fetchApiMergedCalls(apiMergedCallsPage + 1, false, true)
                      }
                      disabled={
                        apiMergedCallsLoading ||
                        apiMergedCallsLoadingMore ||
                        apiMergedCallsPage >=
                          Math.max(1, apiMergedCallsTotalPages || 0)
                      }
                      title="Load next 50"
                    >
                      Load more
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Campaign History Section (moved here after groups, before summary) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-base font-medium text-gray-900">
                  Campaign Runs History
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {campaignHistoryLoading ? (
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  <span>
                    {Array.isArray(campaignHistory)
                      ? campaignHistory.length
                      : 0}{" "}
                    saved run
                    {Array.isArray(campaignHistory) &&
                    campaignHistory.length !== 1
                      ? "s"
                      : ""}
                  </span>
                )}
                <button
                  onClick={() => setCampaignRunsCollapsed((v) => !v)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md border border-gray-200"
                  title={campaignRunsCollapsed ? "Expand" : "Collapse"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${
                      campaignRunsCollapsed ? "transform rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.094l3.71-3.864a.75.75 0 011.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0l-4.24-4.41a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`${campaignRunsCollapsed ? "hidden" : ""}`}>
              {campaignHistoryLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse h-16 bg-gray-100 rounded-md border border-gray-200"
                    />
                  ))}
                </div>
              ) : Array.isArray(campaignHistory) &&
                campaignHistory.length > 0 ? (
                [...campaignHistory]
                  .sort(
                    (a, b) => (b.instanceNumber || 0) - (a.instanceNumber || 0)
                  )
                  .map((run, idx) => (
                    <CampaignHistoryCard
                      key={`${run._id || idx}`}
                      run={run}
                      index={idx}
                    />
                  ))
              ) : (
                <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-gray-200 mx-2 my-4">
                  <div className="text-gray-500 text-base font-medium mb-2">
                    No campaign runs yet
                  </div>
                  <div className="text-gray-400 text-sm">
                    Campaign runs will appear here once the campaign is executed
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Missed Calls list removed; use filter + Call Again button in header */}
        </div>
      </div>
      {/* Report Modal: Completed Contacts by Run */}
      {isReportOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-5xl max-h-[80vh] overflow-auto rounded-lg shadow-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                Completed Contacts Report
              </h3>
              <button
                type="button"
                onClick={closeReport}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <div className="px-4 pb-2 pt-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Selected: {reportSelectedIds.size}
              </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowReportDownloadMenu((v)=>!v)}
                    className="px-3 py-1.5 text-xs font-medium bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                    disabled={reportSelectedIds.size === 0}
                  >
                    <FiDownload />
                    Download
                    <span className="inline-block border-l border-white/20 pl-2">▾</span>
                  </button>
                  {showReportDownloadMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50 overflow-hidden ring-1 ring-black/5">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => { setShowReportDownloadMenu(false); handleDownloadSelectedReportCSV(); }}
                        disabled={isDownloadingReportCSV}
                      >
                        {isDownloadingReportCSV && <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>}
                        Excel (CSV)
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => { setShowReportDownloadMenu(false); handleDownloadSelectedReportPDF(); }}
                        disabled={isDownloadingReportPDF}
                      >
                        {isDownloadingReportPDF && <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>}
                        PDF
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => { setShowReportDownloadMenu(false); handleDownloadSelectedReportTXT(); }}
                        disabled={isDownloadingReportTXT}
                      >
                        {isDownloadingReportTXT && <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>}
                        Text (TXT)
                      </button>
                    </div>
                  )}
                </div>
            </div>
            <div className="p-4 pt-0 space-y-4">
              {reportRuns.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No completed contacts found.
                </div>
              ) : (
                (() => {
                  const flatRows = reportRuns
                    .sort(
                      (a, b) =>
                        (b.instanceNumber || 0) - (a.instanceNumber || 0)
                    )
                    .flatMap((run) =>
                      (run.contacts || []).map((c) => ({ ...c, __run: run }))
                    );
                  const two = (n) => String(n).padStart(2, "0");
                  const fmtDur = (sec) => {
                    const s = Math.max(0, Number(sec) || 0);
                    const m = Math.floor(s / 60);
                    const rs = s % 60;
                    return `${m}:${two(rs)}`;
                  };
                  const fmtDate = (t) => {
                    try {
                      const d = new Date(t);
                      return {
                        date: d.toLocaleDateString(),
                        time: d.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      };
                    } catch {
                      return { date: "-", time: "-" };
                    }
                  };
                  return (
                    <div className="overflow-auto mb-5">
                      <table className="min-w-full text-sm border border-gray-200 rounded-lg mb-5">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr className="text-left text-gray-700">
                            <th className="py-2 px-3">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const next = new Set(reportSelectedIds);
                                  if (checked) {
                                    flatRows.forEach((c) =>
                                      next.add(c.documentId)
                                    );
                                  } else {
                                    flatRows.forEach((c) =>
                                      next.delete(c.documentId)
                                    );
                                  }
                                  setReportSelectedIds(next);
                                }}
                                checked={
                                  flatRows.every((c) =>
                                    reportSelectedIds.has(c.documentId)
                                  ) && flatRows.length > 0
                                }
                              />
                            </th>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Time</th>
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Number</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Duration</th>
                            <th className="py-2 px-3">Lead</th>
                            <th className="py-2 px-3">Run</th>
                            <th className="py-2 px-3">Transcript</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {flatRows.map((c, idx) => {
                            const dt = fmtDate(c.time);
                            const status = String(c.status || "").toLowerCase();
                            const isMissed = status !== "completed";
                            const badgeClass = isMissed
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700";
                            const badgeText = status
                              ? status.charAt(0).toUpperCase() + status.slice(1)
                              : "-";
                            return (
                              <tr
                                key={`${c.documentId}-${idx}`}
                                className="hover:bg-gray-50"
                              >
                                <td className="py-2 px-3">
                                  <input
                                    type="checkbox"
                                    checked={reportSelectedIds.has(
                                      c.documentId
                                    )}
                                    onChange={(e) => {
                                      const next = new Set(reportSelectedIds);
                                      if (e.target.checked)
                                        next.add(c.documentId);
                                      else next.delete(c.documentId);
                                      setReportSelectedIds(next);
                                    }}
                                  />
                                </td>
                                <td className="py-2 px-3 text-gray-600">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-3">{dt.date}</td>
                                <td className="py-2 px-3">{dt.time}</td>
                                <td className="py-2 px-3">{c.name || "-"}</td>
                                <td className="py-2 px-3">{(() => { const n = String(c.number || "-"); return n === "-" ? n : `${n.slice(0,2)}******${n.slice(-2)}`; })()}</td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`inline-block text-xs px-2 py-0.5 rounded-full ${badgeClass}`}
                                  >
                                    {badgeText}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  {fmtDur(c.duration)}
                                </td>
                                <td className="py-2 px-3">
                                  {c.leadStatus || "-"}
                                </td>
                                <td className="py-2 px-3">
                                  #{c.__run?.instanceNumber || "-"}
                                </td>
                                <td className="py-2 px-3">
                                  <button
                                    type="button"
                                    className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                                    onClick={() =>
                                      openTranscriptSmart({
                                        documentId: c.documentId,
                                        number: c.number,
                                        time: c.time,
                                        name: c.name,
                                        duration: c.duration,
                                        status: "completed",
                                      })
                                    }
                                    disabled={!c.documentId}
                                    title="View transcript"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
      {/* Transcript Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90]">
          <div className="relative bg-white rounded-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Top-right close button */}
            <button
              className="absolute top-2 right-2 bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
              onClick={() => setShowTranscriptModal(false)}
              title="Close"
            >
              <FiX />
            </button>
            <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16h8M8 12h8M8 8h8M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H7l-2 2H3v12a2 2 0 002 2z"
                    />
                  </svg>
                  Call Transcript
                  {selectedCall && (
                    <span className="ml-3 text-xs font-normal text-gray-600 whitespace-nowrap">
                      {formatDateTimeCompact(
                        selectedCall.time ||
                          selectedCall.createdAt ||
                          (selectedCall.metadata &&
                            (selectedCall.metadata.startTime ||
                              selectedCall.metadata.callStartTime)) ||
                          (selectedCall.externalResponse &&
                            selectedCall.externalResponse.startTime)
                      )}
                    </span>
                  )}
                </h3>
                {/* Call Details */}
                {selectedCall && (
                  <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3">
                      <div className="text-sm text-gray-500 mb-1">
                        Contact Name
                      </div>
                      <div className="font-semibold text-gray-800">
                        {getContactDisplayNameBlank(selectedCall)}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm text-gray-500 mb-1">
                        Phone Number
                      </div>
                      <div className="font-semibold text-gray-800">
                        {selectedCall.number || selectedCall.phone || ""}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm text-gray-500 mb-1">
                        Call Duration
                      </div>
                      <div className="font-semibold text-gray-800">
                        {formatDuration(selectedCall.duration || 0)}
                      </div>
                    </div>
                    {/* Removed large Call Started block to save space */}
                  </div>
                )}
              </div>
              {/* Action buttons */}
              <div className="relative ml-3" ref={downloadMenuRef}>
                <button
                  className={`text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 border focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    showDownloadMenu
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-black text-white border-transparent hover:bg-gray-800"
                  }`}
                  onClick={() => setShowDownloadMenu((v) => !v)}
                  title="Download"
                  disabled={isDownloadingPdf}
                >
                  {isDownloadingPdf ? (
                    <>
                      <FiLoader className="animate-spin" />
                      
                    </>
                  ) : (
                    <>
                      <FiDownload />
                      
                    </>
                  )}
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl z-10 overflow-hidden ring-1 ring-black/5">
                    <button
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => {
                        setShowDownloadMenu(false);
                        handleDownloadTranscriptPDF();
                      }}
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-800"></span>
                      <span>PDF</span>
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => {
                        setShowDownloadMenu(false);
                        handleDownloadTranscriptTXT();
                      }}
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                      <span>TXT</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden audio element bound to the selected call */}
              {audioUrl ? (
  <audio
    key={selectedCall?._id || 'call-audio'}
    ref={audioRef}
    src={audioUrl}
    preload="none"
    crossOrigin="anonymous"
    onEnded={() => setIsPlaying(false)}
    onPause={() => setIsPlaying(false)}
    onPlay={() => setIsPlaying(true)}
  />
) : null}

              {/* WhatsApp redirect button */}
              <button
                className="ml-3 bg-green-500 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-60"
                onClick={async () => {
                  try {
                    const raw =
                      (selectedCall &&
                        (selectedCall.number ||
                          selectedCall.phone ||
                          selectedCall.mobile ||
                          (selectedCall.metadata &&
                            selectedCall.metadata.customParams &&
                            selectedCall.metadata.customParams.phone))) ||
                      "";
                    const digits = String(raw || "").replace(/\D/g, "");
                    // Remove any leading zeros (e.g., 09546423919 -> 9546423919)
                    const normalized = digits.replace(/^0+/, "");
                    // Ensure Indian country code is prefixed (WhatsApp expects country code without +)
                    const phone = normalized.startsWith("91")
                      ? normalized
                      : normalized
                      ? `91${normalized}`
                      : "";
                    if (!phone) {
                      try {
                        toast.warn("No phone number found");
                      } catch {}
                      return;
                    }
                    // Explicitly open WhatsApp Web with default prefilled text from agent first message (public endpoint)
                    let agentMsg = '';
                    try {
                      const primaryAgentId = getPrimaryAgentId();
                      if (primaryAgentId) {
                        const resp = await fetch(`${API_BASE}/agents/${primaryAgentId}/public`);
                        const result = await resp.json();
                        if (resp.ok && result?.data) {
                          const ag = result.data;
                          agentMsg = ag.firstMessage || (Array.isArray(ag.startingMessages) && ag.startingMessages[0]?.text) || '';
                        }
                      }
                    } catch (_) {}
                    const text = agentMsg ? `&text=${encodeURIComponent(agentMsg)}` : '';
                    const url = `https://web.whatsapp.com/send?phone=${phone}${text}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  } catch (_) {}
                }}
                title="Open WhatsApp"
                disabled={!selectedCall}
              >
                <FaWhatsapp />
              </button>

              {/* Play/Pause recording button */}
              <button
                className="ml-3 bg-white text-gray-800 text-sm px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-60"
                onClick={handlePlayPause}
                title={isPlaying ? 'Pause recording' : 'Play recording'}
                disabled={!audioUrl}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              {/* End Call (shown when call appears active) */}
              {selectedCall?.metadata?.isActive !== false && (
                <button
                  className="ml-3 bg-red-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  onClick={terminateCurrentCall}
                  title="End call"
                  aria-label="End call"
                >
                  {/* phone hang up shape */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M21 15.46l-5.27-1.17a2 2 0 00-1.95.51l-1.27 1.27a16.91 16.91 0 01-7.32-7.32l1.27-1.27a2 2 0 00.51-1.95L8.54 3H3a1 1 0 00-1 1 19 19 0 0019 19 1 1 0 001-1v-5.54a1 1 0 00-.99-1z" />
                  </svg>
                </button>
              )}
              {/* Assign button in transcript header */}
              <div className="relative ml-3">
                <button
                  className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
                  onClick={() => setOpenAssignFor(openAssignFor === 'transcript' ? null : 'transcript')}
                  title="Assign"
                >
                  Assign ▾
                </button>
                {openAssignFor === 'transcript' && (
                  <div className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded shadow z-10">
                    {["t1","t2","t3","t4","t5"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                        onClick={() => { setRowAssignments((prev)=>({ ...prev, transcript: tag })); setOpenAssignFor(null); }}
                      >
                        {tag.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {transcriptLoading ? (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-500 mt-4 text-xl">
                    Loading transcript...
                  </p>
                </div>
              ) : transcriptContent ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {parseTranscriptToChat(transcriptContent).map(
                    (message, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        {message.isAI ? (
                          <div className="flex justify-start">
                            <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="bg-blue-500 text-white rounded-lg px-4 py-2 shadow-sm">
                                <div className="text-lg">{message.text}</div>
                                {message.timestamp && (
                                  <div className="text-xs text-blue-100 mt-1">
                                    {message.timestamp}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : message.isUser ? (
                          <div className="flex justify-end">
                            <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                              <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 shadow-sm">
                                <div className="text-sm">{message.text}</div>
                                {message.timestamp && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {message.timestamp}
                                  </div>
                                )}
                              </div>
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="bg-gray-100 text-gray-600 rounded-lg px-3 py-1 text-xs">
                              {message.text}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <svg
                    className="w-8 h-8 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  No transcript available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Insufficient Credits Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Insufficient Balance
              </h3>
              <button
                className="bg-none border-none text-xl cursor-pointer text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                onClick={() => setShowCreditsModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">
                Not sufficient credits. Please recharge first to start calling.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowCreditsModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={() => {
                  setShowCreditsModal(false);
                  // Navigate to Credits/Recharge section (adjust route if different)
                  window.location.href = "/auth/credits";
                }}
              >
                Add Credits
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Make Calls Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 call-modal">
          <div className="bg-white rounded-2xl w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Make Calls to Campaign Groups
                </h3>
                <p className="text-gray-600 mt-1">
                  Automate your campaign calling process
                </p>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-sm text-blue-700">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 9a1 1 0 000 2h6a1 1 0 100-2H7zm3 3a1 1 0 000 2H7a1 1 0 100 2h3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      <strong>Auto-save enabled:</strong> Your calling progress
                      is automatically saved and will persist across page
                      reloads. You can continue calling from where you left off!
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowCallModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {/* Agent Selection */}
              {!selectedAgent && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Select an Agent
                  </h4>
                  {loadingAgents ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="text-gray-500 mt-4 text-lg">
                        Loading agents...
                      </p>
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <h5 className="text-lg font-medium text-gray-900 mb-2">
                        No agents available
                      </h5>
                      <p className="text-gray-500">
                        Please create agents before starting calls
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {agents.map((agent) => (
                        <div
                          key={agent._id}
                          className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                          onClick={() => setSelectedAgent(agent)}
                        >
                          <div className="flex items-center mb-4">
                            <div className="p-3 bg-blue-100 rounded-lg mr-4 group-hover:bg-blue-200 transition-colors duration-200">
                              <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                {agent.agentName}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {agent.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            Click to select this agent
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Calling Interface */}
              {selectedAgent && (
                <div>
                  <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                          <svg
                            className="w-6 h-6 mr-2 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Selected Agent: {selectedAgent.agentName}
                        </h4>
                        <p className="text-gray-700">
                          {selectedAgent.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedAgent(null)}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-lg transition-colors duration-200"
                      >
                        Change Agent
                      </button>
                    </div>
                  </div>
                  {/* Campaign Overview */}
                  <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Campaign Overview
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {loadingContacts ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          ) : (
                            campaignContacts.length
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Campaign Contacts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {loadingContacts ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          ) : (
                            campaignContacts.length
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Contacts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {loadingContacts ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                          ) : (
                            getContactDisplayNameBlank(
                              campaignContacts[currentContactIndex]
                            ) || "None"
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Current Contact
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 capitalize">
                          {callingStatus}
                        </div>
                        <div className="text-sm text-gray-600">Status</div>
                      </div>
                    </div>
                  </div>
                  {/* Call Progress */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xl font-semibold text-gray-800 flex items-center">
                        <svg
                          className="w-6 h-6 mr-2 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Call Progress
                      </h4>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">
                          Contact {currentContactIndex + 1} of{" "}
                          {campaignContacts.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getContactDisplayNameBlank(
                            campaignContacts[currentContactIndex]
                          ) || ""}
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${
                            (getProgress().completed / getProgress().total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    {/* Current Contact */}
                    {callingStatus !== "idle" &&
                      campaignContacts[currentContactIndex] && (
                        <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 mb-6">
                          <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <svg
                              className="w-5 h-5 mr-2 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            Currently Calling
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Name</div>
                              <div className="font-semibold text-gray-900">
                                {getContactDisplayNameBlank(
                                  campaignContacts[currentContactIndex]
                                ) || ""}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Phone</div>
                              <div className="font-semibold text-gray-900">
                                {campaignContacts[currentContactIndex]?.phone ||
                                  ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    {/* Save Progress Button */}
                    {callingStatus !== "idle" && (
                      <div className="flex justify-center mb-4 space-x-3">
                        <button
                          onClick={manualSaveState}
                          className="inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                          title="Manually save your calling progress"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Save Progress
                        </button>
                        {/* Cleanup Duplicates Button */}
                        <button
                          onClick={removeDuplicateCallResults}
                          className="inline-flex items-center px-4 py-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all duration-200"
                          title="Remove duplicate call results"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Clean Duplicates
                        </button>
                        {/* Update Call Status Button */}
                        <button
                          onClick={() => {
                            // Update status for all call results with uniqueIds
                            callResults.forEach((result) => {
                              if (result.uniqueId) {
                                updateCallStatus(result.uniqueId);
                              }
                            });
                          }}
                          className="inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                          title="Update call status from external service"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Update Status
                        </button>
                      </div>
                    )}
                    {/* Control Buttons */}
                    <div className="flex gap-4 justify-center">
                      {callingStatus === "idle" && (
                        <button
                          onClick={startCalling}
                          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          <FiPlay className="w-5 h-5 mr-2" />
                          Start Calling
                        </button>
                      )}
                      {callingStatus === "calling" && (
                        <>
                          <button
                            onClick={pauseCalling}
                            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-lg font-semibold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            <FiPause className="w-5 h-5 mr-2" />
                            Pause
                          </button>
                          <button
                            onClick={skipToNext}
                            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            <FiSkipForward className="w-5 h-5 mr-2" />
                            Skip
                          </button>
                        </>
                      )}
                      {callingStatus === "paused" && (
                        <button
                          onClick={resumeCalling}
                          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          <FiPlay className="w-5 h-5 mr-2" />
                          Resume
                        </button>
                      )}
                      {(callingStatus === "completed" ||
                        callingStatus === "paused") && (
                        <button
                          onClick={resetCalling}
                          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-lg font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Call Results */}
                  {callResults.length > 0 && (
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-6 h-6 mr-2 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Call Results
                      </h4>
                      <div className="max-h-80 overflow-y-auto space-y-3">
                        {callResults.map((result, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-xl border-2 ${
                              result.success
                                ? "bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 hover:border-green-300 transition-all duration-200"
                                : "bg-red-50 border-red-200"
                            }`}
                            onClick={() => {
                              if (result.success && result.uniqueId) {
                                // Create a call object with the necessary data for live logs
                                const callData = {
                                  _id: `result-${index}`,
                                  name: getContactName(result.contact),
                                  mobile: result.contact.phone,
                                  agentId: {
                                    agentName:
                                      selectedAgent?.agentName ||
                                      "Campaign Agent",
                                  },
                                  leadStatus: "connected",
                                  metadata: {
                                    customParams: {
                                      uniqueid: result.uniqueId,
                                    },
                                  },
                                  createdAt:
                                    result.timestamp instanceof Date
                                      ? result.timestamp
                                      : new Date(result.timestamp),
                                  time:
                                    result.timestamp instanceof Date
                                      ? result.timestamp
                                      : new Date(result.timestamp),
                                  duration: 0,
                                  callType: "outbound",
                                };
                                handleViewLiveCall(callData);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h6 className="font-semibold text-gray-800 mb-1">
                                  {getContactDisplayNameBlank(result.contact)}
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">
                                      Phone:
                                    </span>
                                    <div className="font-medium">
                                      {result.contact.phone}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Time:</span>
                                    <div className="font-medium">
                                      {safeFormatTimestamp(result.timestamp)}
                                    </div>
                                  </div>
                                  {result.uniqueId && (
                                    <div>
                                      <span className="text-gray-600">ID:</span>
                                      <div className="font-medium text-xs">
                                        {result.uniqueId.substring(0, 20)}...
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    result.success
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {result.success ? "Success" : "Failed"}
                                </span>
                                {result.success && result.uniqueId && (
                                  <>
                                    <div className="mt-2 flex items-center text-xs text-blue-600">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Click to view live logs
                                    </div>
                                    {/* Connection Status */}
                                    <div className="mt-2">
                                      <div
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                          callResultsConnectionStatus[
                                            result.uniqueId
                                          ] === "connected"
                                            ? "bg-green-100 text-green-700 border border-green-200"
                                            : callResultsConnectionStatus[
                                                result.uniqueId
                                              ] === "not_connected"
                                            ? "bg-red-100 text-red-700 border border-red-200"
                                            : "bg-gray-100 text-gray-600 border border-gray-200"
                                        }`}
                                      >
                                        <div
                                          className={`w-2 h-2 rounded-full mr-1 ${
                                            callResultsConnectionStatus[
                                              result.uniqueId
                                            ] === "connected"
                                              ? "bg-green-500"
                                              : callResultsConnectionStatus[
                                                  result.uniqueId
                                                ] === "not_connected"
                                              ? "bg-red-500"
                                              : "bg-gray-400"
                                          }`}
                                        ></div>
                                        {callResultsConnectionStatus[
                                          result.uniqueId
                                        ] === "connected"
                                          ? "Connected"
                                          : callResultsConnectionStatus[
                                              result.uniqueId
                                            ] === "not_connected"
                                          ? "Not Accepted / Busy / Disconnected"
                                          : "Checking..."}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            {result.error && (
                              <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                <p className="text-sm text-red-700">
                                  <span className="font-semibold">Error:</span>{" "}
                                  {result.error}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Call Details Modal */}
      {showCallDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Call Details</h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowCallDetailsModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {callDetailsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-500 mt-2">Loading call logs...</p>
                </div>
              ) : callDetails.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h5 className="text-lg font-medium text-gray-600 mb-2">
                    No call logs
                  </h5>
                  <p className="text-gray-500">
                    No calls found for this campaign yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {callDetails.map((log) => (
                    <div
                      key={log._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm text-gray-500">Time</div>
                          <div className="font-semibold">
                            {new Date(
                              log.createdAt || log.time
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Duration</div>
                          <div className="font-semibold">
                            {Math.max(0, log.duration || 0)}s
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div>
                          <div className="text-sm text-gray-500">Mobile</div>
                          <div className="font-medium">{log.mobile || "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Agent</div>
                          <div className="font-medium">
                            {log.agentId?.agentName || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">
                            Lead Status
                          </div>
                          <div className="font-medium capitalize">
                            {log.leadStatus || "-"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500 break-all">
                        <span className="font-semibold">uniqueId:</span>{" "}
                        {log.metadata?.customParams?.uniqueid || "-"}
                      </div>
                      {log.transcript && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-blue-600">
                            View transcript
                          </summary>
                          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded mt-2 max-h-64 overflow-y-auto">
                            {log.transcript}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {callDetailsPage} of {callDetailsMeta.totalPages || 1} •
                  Total {callDetailsMeta.totalLogs || 0}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    onClick={() =>
                      fetchCampaignCallLogs(Math.max(1, callDetailsPage - 1))
                    }
                    disabled={callDetailsPage <= 1 || callDetailsLoading}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    onClick={() => fetchCampaignCallLogs(callDetailsPage + 1)}
                    disabled={
                      callDetailsLoading ||
                      (callDetailsMeta.totalPages &&
                        callDetailsPage >= callDetailsMeta.totalPages)
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Campaign Contacts Management Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">
                Manage Campaign Contacts
              </h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowContactsModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Contact
                </button>
                <button
                  onClick={syncContactsFromGroups}
                  disabled={
                    loadingContacts ||
                    !campaign?.groupIds ||
                    campaign.groupIds.length === 0
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingContacts ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FiUsers className="w-4 h-4" />
                  )}
                  Sync from Groups
                </button>
                <button
                  onClick={async () => {
                    await syncContactsFromGroups(true);
                    await fetchCampaignContacts();
                  }}
                  disabled={loadingContacts}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
              {/* Select and Call Controls */}
              {campaignContacts.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectAllContacts}
                          onChange={handleSelectAllContacts}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Select All ({selectedContacts.length} selected)
                        </span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={callSelectedContacts}
                        disabled={selectedContacts.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        Call Selected ({selectedContacts.length})
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContacts([]);
                          setSelectAllContacts(false);
                        }}
                        disabled={selectedContacts.length === 0}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Contacts List */}
              {loadingContacts ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-500 mt-2">Loading contacts...</p>
                </div>
              ) : campaignContacts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h5 className="text-lg font-medium text-gray-600 mb-2">
                    No contacts in campaign
                  </h5>
                  <p className="text-gray-500">
                    Add contacts manually or sync from groups to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaignContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className={`border rounded-lg p-4 ${
                        isContactSelected(contact)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isContactSelected(contact)}
                            onChange={() => handleSelectContact(contact)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
                          />
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <div className="text-sm text-gray-500">
                                  Name
                                </div>
                                <div className="font-semibold">
                                  {getContactDisplayNameBlank(contact)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">
                                  Phone
                                </div>
                                <div className="font-medium">
                                  {contact.phone}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">
                                  Email
                                </div>
                                <div className="font-medium">
                                  {contact.email || "-"}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Added:{" "}
                              {new Date(contact.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() =>
                              removeContactFromCampaign(contact._id)
                            }
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">
                Add Contact to Campaign
              </h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowAddContactModal(false)}
              >
                <FiX />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addContactToCampaign();
              }}
              className="p-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    placeholder="Enter name (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phone: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingContacts}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loadingContacts ? "Adding..." : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Groups Modal */}
      {showAddGroupsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl add-groups-modal">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">
                Add Groups to Campaign
              </h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={handleCloseAddGroupsModal}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {/* Current groups in campaign */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Current Groups in Campaign
                </h4>
                {campaignGroups.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No groups added yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campaignGroups.map((group) => (
                      <div
                        key={`current-${group._id}`}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-800">
                              {group.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {typeof group.contactsCount === "number"
                                ? group.contactsCount
                                : group.contacts?.length || 0}{" "}
                              contacts
                            </div>
                          </div>
                          <button
                            className="text-red-600 hover:text-red-700"
                            title="Remove from campaign"
                            onClick={() => handleRemoveGroup(group._id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Available Groups
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Select groups to add to this campaign. Only groups not already
                  in the campaign are shown.
                </p>
                {getAvailableGroupsForCampaign().length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                    <h5 className="text-lg font-medium text-gray-600 mb-2">
                      No available groups
                    </h5>
                    <p className="text-gray-500">
                      All groups are already in this campaign
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getAvailableGroupsForCampaign().map((group) => (
                      <div
                        key={group._id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
                        onClick={() => {
                          const currentSelected = selectedGroups.filter(
                            (id) => !campaignGroups.some((cg) => cg._id === id)
                          );
                          if (currentSelected.includes(group._id)) {
                            setSelectedGroups(
                              currentSelected.filter((id) => id !== group._id)
                            );
                          } else {
                            setSelectedGroups([...currentSelected, group._id]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-800">
                            {group.name}
                          </h5>
                          <div
                            className={`w-5 h-5 rounded border-2 ${
                              selectedGroups.includes(group._id) &&
                              !campaignGroups.some((cg) => cg._id === group._id)
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300"
                            } flex items-center justify-center`}
                          >
                            {selectedGroups.includes(group._id) &&
                              !campaignGroups.some(
                                (cg) => cg._id === group._id
                              ) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {group.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          {typeof group.contactsCount === "number"
                            ? group.contactsCount
                            : group.contacts?.length || 0}{" "}
                          contacts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseAddGroupsModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const groupsToAdd = selectedGroups.filter(
                      (id) => !campaignGroups.some((cg) => cg._id === id)
                    );
                    handleAddSpecificGroupsToCampaign(groupsToAdd);
                  }}
                  disabled={
                    addingGroups ||
                    selectedGroups.filter(
                      (id) => !campaignGroups.some((cg) => cg._id === id)
                    ).length === 0
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {addingGroups ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>Update</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Select Agent</h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowAddAgentModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {loadingAgents ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-500 mt-2">Loading agents...</p>
                </div>
              ) : (agents || []).length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h5 className="text-lg font-medium text-gray-600 mb-2">
                    No agents available
                  </h5>
                  <p className="text-gray-500">Create an agent to proceed.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {agents.map((agent) => (
                    <label
                      key={agent._id}
                      className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer ${
                        selectedAgentIdForAssign === agent._id
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedAgentIdForAssign(agent._id)}
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {agent.agentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {agent.description}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="assignAgent"
                        checked={selectedAgentIdForAssign === agent._id}
                        onChange={() => setSelectedAgentIdForAssign(agent._id)}
                      />
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddAgentModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedAgentIdForAssign}
                  onClick={saveSelectedAgentToCampaign}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Live Call Modal */}
      {showLiveCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Live Call Logs
                </h3>
                <p className="text-gray-600 mt-1">
                  Real-time call transcript and details
                </p>
              </div>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={closeLiveCallModal}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {/* Call Information */}
              {selectedCall && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Contact</div>
                      <div className="font-semibold">
                        {getContactDisplayNameBlank(selectedCall)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Agent</div>
                      <div className="font-semibold">
                        {selectedCall.agentId?.agentName || ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-semibold capitalize">
                        {selectedCall.leadStatus || ""}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-semibold">uniqueId:</span>{" "}
                    {selectedCall.metadata?.customParams?.uniqueid || ""}
                  </div>
                </div>
              )}
              {/* Live Status Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        isPolling
                          ? "bg-green-500 animate-pulse"
                          : liveCallDetails?.metadata?.isActive === false
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-sm font-medium">
                      {isPolling
                        ? "Live - Polling for updates..."
                        : liveCallDetails?.metadata?.isActive === false
                        ? "Call ended - Polling stopped"
                        : "Not polling"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    {liveCallDetails
                      ? `Last updated: ${new Date().toLocaleTimeString()}`
                      : "Waiting for call data..."}
                    {(isPolling ||
                      liveCallDetails?.metadata?.isActive !== false) && (
                      <button
                        type="button"
                        onClick={terminateCurrentCall}
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        title="End call"
                      >
                        End Call
                      </button>
                    )}
                  </div>
                </div>
                {/* Connection Status */}
                <div
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    callConnectionStatus === "connected"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      callConnectionStatus === "connected"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  {callConnectionStatus === "connected"
                    ? "Call Connected"
                    : "Not Accepted / Busy / Disconnected"}
                  {callConnectionStatus === "not_connected" && (
                    <span className="ml-2 text-xs opacity-75">
                      {liveCallDetails?.metadata?.isActive === false
                        ? "(Call ended by system)"
                        : "(No response for 40+ seconds)"}
                    </span>
                  )}
                </div>
              </div>
              {/* Live Transcript */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Live Transcript
                </h4>
                {liveTranscriptLines.length > 0 ? (
                  <div
                    ref={transcriptRef}
                    className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto"
                  >
                    {liveTranscriptLines.map((line, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        {line.isAI ? (
                          <div className="flex justify-start">
                            <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="bg-blue-500 text-white rounded-lg px-4 py-2 shadow-sm">
                                <div className="text-sm">{line.text}</div>
                                {line.timestamp && (
                                  <div className="text-xs text-blue-100 mt-1">
                                    {line.timestamp}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : line.isUser ? (
                          <div className="flex justify-end">
                            <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                              <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 shadow-sm">
                                <div className="text-sm">{line.text}</div>
                                {line.timestamp && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {line.timestamp}
                                  </div>
                                )}
                              </div>
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="bg-gray-100 text-gray-600 rounded-lg px-3 py-1 text-xs">
                              {line.text}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : liveTranscript ? (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {liveTranscript}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                    <svg
                      className="w-8 h-8 mx-auto mb-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    No transcript available yet. Waiting for call data...
                  </div>
                )}
              </div>
              {/* Call Details */}
              {liveCallDetails && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Call Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Duration</div>
                      <div className="font-semibold">
                        {Math.max(0, liveCallDetails.duration || 0)}s
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">
                        Call Time
                      </div>
                      <div className="font-semibold">
                        {new Date(
                          liveCallDetails.createdAt || liveCallDetails.time
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">
                        Lead Status
                      </div>
                      <div className="font-semibold capitalize">
                        {liveCallDetails.leadStatus || ""}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">
                        Call Type
                      </div>
                      <div className="font-semibold capitalize">
                        {liveCallDetails.callType || ""}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {waChatOpen && (
        <div className="fixed bottom-4 right-4 w-110 h-[650px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-sm">
          {/* Enhanced Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FaWhatsapp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {waChatContact?.name || "WhatsApp Chat"}
                </h3>
                <p className="text-xs text-green-100">
                  {waChatContact?.number || ""}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* 24h countdown timer */}
              <div
                className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200 shadow-sm"
                title="Time left in this 24h session"
              >
                ⏱ {waChatRemaining}
              </div>
              <button
                type="button"
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                onClick={() => fetchWaChatMessages(waChatContact?.number)}
                title="Refresh messages"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                onClick={() => setWaChatOpen(false)}
                title="Close"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Enhanced Chat Area */}
          <div className="flex-1 overflow-y-auto relative bg-gradient-to-b from-gray-50 to-white">
            <div className="p-4 space-y-3">
              {renderMessagesWithDateSeparators()}
              {waTyping && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 text-sm italic shadow-sm animate-pulse">
                    <div className="flex items-center space-x-2">
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
                      <span>typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Enhanced Template Selector Popup */}
          {waTemplatesOpen && (
            <div className="absolute top-4 right-4 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-10 backdrop-blur-sm">
              {/* Enhanced Header */}
              <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Select Template
                    </h3>
                  </div>
                  <button
                    onClick={() => setWaTemplatesOpen(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-white/50 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="max-h-80 overflow-y-auto">
                {waTemplatesLoading ? (
                  <div className="text-center py-8">
                    <div className="text-sm text-gray-500">
                      Loading templates...
                    </div>
                  </div>
                ) : waTemplates.length > 0 ? (
                  <div>
                    {waTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between px-4 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200 hover:shadow-sm"
                        onClick={() => sendWaTemplateMessage(template)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-sm font-semibold text-gray-800 truncate">
                              {template.name}
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                template.status === "APPROVED"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              }`}
                            >
                              {template.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {template.components
                              ?.find((c) => c.type === "BODY")
                              ?.text?.substring(0, 80)}
                            {template.components?.find((c) => c.type === "BODY")
                              ?.text?.length > 80
                              ? "..."
                              : ""}
                          </div>
                          {template.components?.find(
                            (c) => c.type === "BUTTONS"
                          ) && (
                            <div className="text-xs text-blue-600 mt-2 flex items-center">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                />
                              </svg>
                              Has interactive buttons
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-sm text-gray-500">
                      No templates available
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Enhanced Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex items-end space-x-3">
              <button
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200 shadow-sm hover:shadow-md"
                onClick={toggleWaTemplates}
                title="Templates"
              >
                <FiPlus className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={waChatInput}
                  onChange={(e) => setWaChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendWaChatMessage();
                  }}
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                />
                <button
                  type="button"
                  onClick={sendWaChatMessage}
                  disabled={!waChatInput.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default CampaignDetails;