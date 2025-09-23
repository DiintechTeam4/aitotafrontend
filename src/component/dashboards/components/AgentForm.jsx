"use client";
import { FiMail, FiMessageSquare, FiTrash2, FiEdit } from "react-icons/fi";
import { useState, useEffect } from "react";
import VoiceSynthesizer from "./VoiceSynthesizer";
import AudioRecorder from "./AudioRecorder";
import { API_BASE_URL } from "../../../config";

const AgentForm = ({
  agent,
  onSave,
  onCancel,
  clientId,
  initialServiceProvider,
  lockServiceProvider = false,
  clientToken,
}) => {
  const [selectedTab, setSelectedTab] = useState("starting");
  const [selectedSocialTab, setSelectedSocialTab] = useState("whatsapp");
  const [formData, setFormData] = useState({
    agentName: "",
    description: "",
    category: "",
    personality: "formal",
    language: "en",
    firstMessage: "",
    systemPrompt: "",
    sttSelection: "google",
    ttsSelection: "sarvam",
    voiceServiceProvider: "sarvam",
    voiceSelection: "anushka",
    voiceId: "",
    accountSid: "",
    serviceProvider: "",
    callingType: "both",
    callingNumber: "",
    callerId: "",
    X_API_KEY: "",
    // Customization
    uiImage: "",
    backgroundImage: "",
    backgroundColor: "",
  });

  const [startingMessages, setStartingMessages] = useState([{ text: "" }]);
  const [defaultStartingMessageIndex, setDefaultStartingMessageIndex] =
    useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [socialMediaLinks, setSocialMediaLinks] = useState([
    { platform: "", url: "" },
  ]);
  // Knowledge base and Depositions state
  const [knowledgeBaseItems, setKnowledgeBaseItems] = useState([]);
  const [uploadingKb, setUploadingKb] = useState(false);
  const [selectedKbType, setSelectedKbType] = useState('text');
  const [kbFormData, setKbFormData] = useState({
    title: '',
    description: '',
    content: {}
  });
  const [showKbModal, setShowKbModal] = useState(false);
  const [depositions, setDepositions] = useState([
    { title: "Interested", sub: [] },
    { title: "Not Interested", sub: [] },
    { title: "Not Contactable", sub: [] },
    { title: "Existing client", sub: [] },
    { title: "Meeting", sub: [] },
  ]);
  const [assignedTemplates, setAssignedTemplates] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState(null);
  const [uiImagePreview, setUiImagePreview] = useState("");
  const [backgroundImagePreview, setBackgroundImagePreview] = useState("");

  // System Configuration subtabs and Q&A state
  const [systemSubTab, setSystemSubTab] = useState('prompt'); // 'prompt' | 'qa'
  const [qaItems, setQaItems] = useState([]);
  const [isSavingQa, setIsSavingQa] = useState(false);
  const [showAddQa, setShowAddQa] = useState(false);
  const [newQa, setNewQa] = useState({ question: '', answer: '' });
  const [editingQaIndex, setEditingQaIndex] = useState(null);
  const [editingQaDraft, setEditingQaDraft] = useState({ question: '', answer: '' });

  // Voice mapping for different services
  const voiceMappings = {
    sarvam: {
      anushka: { name: "Anushka", id: "anushka" },
      meera: { name: "Meera", id: "meera" },
      pavithra: { name: "Pavithra", id: "pavithra" },
      maitreyi: { name: "Maitreyi", id: "maitreyi" },
      arvind: { name: "Arvind", id: "arvind" },
      amol: { name: "Amol", id: "amol" },
      amartya: { name: "Amartya", id: "amartya" },
      diya: { name: "Diya", id: "diya" },
      neel: { name: "Neel", id: "neel" },
      misha: { name: "Misha", id: "misha" },
      vian: { name: "Vian", id: "vian" },
      arjun: { name: "Arjun", id: "arjun" },
      maya: { name: "Maya", id: "maya" },
    },
    elevenlabs: {
      kumaran: { name: "Kumaran", id: "rgltZvTfiMmgWweZhh7n" },
      monika: { name: "Monika", id: "NaKPQmdr7mMxXuXrNeFC" },
      aahir: { name: "Aahir", id: "RKshBIkZ7DwU6YNPq5Jd" },
      kanika: { name: "Kanika", id: "xccfcojYYGnqTTxwZEDU" },
    }
  };

  const tabs = [
    { key: "starting", label: "Starting Messages" },
    { key: "personal", label: "Personal Information" },
    { key: "voice", label: "Voice Configuration" },
    { key: "system", label: "System Configuration" },
    // { key: "integration", label: "Telephony Settings" },
    { key: "social", label: "Action" },
    { key: "customization", label: "Customization" },
    { key: "knowledge", label: "Knowledge Base" },
    { key: "dispositions", label: "Dispositions" },
  ];

  useEffect(() => {
    if (agent) {
      setFormData({
        agentName: agent.agentName || "",
        description: agent.description || "",
        category: agent.category || "",
        personality: agent.personality || "formal",
        language: agent.language || "en",
        firstMessage: agent.firstMessage || "",
        systemPrompt: agent.systemPrompt || "",
        sttSelection: agent.sttSelection || "google",
        ttsSelection: agent.ttsSelection || "sarvam",
        voiceServiceProvider: agent.voiceServiceProvider || "sarvam",
        callingNumber: agent.callingNumber || "",
        callingType: agent.callingType || "both",
        voiceSelection: agent.voiceSelection || "anushka",
        voiceId: agent.voiceId || "",
        accountSid: agent.accountSid || "",
        serviceProvider: agent.serviceProvider || "",
        callerId: agent.callerId || "",
        X_API_KEY: agent.X_API_KEY || "",
        uiImage: agent.uiImage || "",
        backgroundImage: agent.backgroundImage || "",
        backgroundColor: agent.backgroundColor || "",
      });

      // Load starting messages if they exist
      if (agent.startingMessages && agent.startingMessages.length > 0) {
        setStartingMessages(agent.startingMessages);
        setDefaultStartingMessageIndex(agent.defaultStartingMessageIndex || 0);
      }

      // Hydrate knowledge base and depositions
      // For knowledge base, fetch from the separate KnowledgeBase collection
      if (agent._id) {
        fetchKnowledgeBaseItems();
      } else {
        setKnowledgeBaseItems(
          Array.isArray(agent.knowledgeBase) ? agent.knowledgeBase : []
        );
      }
      
      if (Array.isArray(agent.depositions) && agent.depositions.length > 0) {
        setDepositions(agent.depositions);
      }
    }
  }, [agent]);

  // Initialize Q&A from agent
  useEffect(() => {
    if (agent && Array.isArray(agent.qa)) {
      setQaItems(agent.qa.map(q => ({ question: q.question || '', answer: q.answer || '' })));
    } else {
      setQaItems([]);
    }
  }, [agent]);

  // Hydrate social links from agent record when available
  useEffect(() => {
    if (!agent) return;
    const hydrated = [];

    // Handle WhatsApp with automatic default selection
    if (agent.whatsappEnabled) {
      const wa =
        agent.whatsapplink ||
        (Array.isArray(agent.whatsapp) && agent.whatsapp[0]?.link) ||
        "";
      // Mark enabled even if link is empty
      hydrated.push({ platform: "whatsapp", url: wa });
      if (!wa) {
        // If there's only one WhatsApp template, make it default
        const whatsappTemplates = agent.whatsappTemplates || [];
        if (whatsappTemplates.length === 1) {
          hydrated[hydrated.length - 1].url =
            whatsappTemplates[0].templateUrl || "";
        }
      }

      // Set default template if available
      if (agent.defaultTemplate) {
        setDefaultTemplate(agent.defaultTemplate);
      }
    }

    if (agent.telegramEnabled) {
      const tg =
        (Array.isArray(agent.telegram) && agent.telegram[0]?.link) || "";
      hydrated.push({ platform: "telegram", url: tg });
    }
    if (agent.emailEnabled) {
      const em = (Array.isArray(agent.email) && agent.email[0]?.link) || "";
      hydrated.push({ platform: "email", url: em });
    }
    if (agent.smsEnabled) {
      const sm = (Array.isArray(agent.sms) && agent.sms[0]?.link) || "";
      hydrated.push({ platform: "sms", url: sm });
    }
    if (hydrated.length > 0) setSocialMediaLinks(hydrated);
  }, [agent]);

  // If parent sets an initial provider (e.g. Admin flow), apply it
  useEffect(() => {
    if (initialServiceProvider) {
      setFormData((prev) => ({
        ...prev,
        serviceProvider: initialServiceProvider,
      }));
    }
  }, [initialServiceProvider]);

  const fetchAudio = async (agentId) => {
    try {
      const authToken =
        clientToken ||
        sessionStorage.getItem("clienttoken") ||
        localStorage.getItem("admintoken");
      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agentId}/audio${
          clientId ? `?clientId=${clientId}` : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (response.ok) {
        const audioBlob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1];
          setFormData((prev) => ({ ...prev, audioBase64: base64data }));
        };
        reader.readAsDataURL(audioBlob);
      }
    } catch (error) {
      console.error("Error fetching audio:", error);
    }
  };

  useEffect(() => {
    if (agent && agent._id) {
      // Only attempt load if audio hints exist to avoid 404 spam
      if (agent.audioBytes || agent.audioFile) {
        fetchAudio(agent._id);
      }
    }
  }, [agent, clientId]);

  // Fetch templates assigned to this agent (admin assigns)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        if (!agent || !agent._id) return;
        const resp = await fetch(
          `${API_BASE_URL}/templates/agent/${agent._id}`
        );
        const json = await resp.json();
        if (json.success) {
          setAssignedTemplates(Array.isArray(json.data) ? json.data : []);
        }
      } catch (_) {
        setAssignedTemplates([]);
      }
    };
    loadTemplates();
  }, [agent]);

  // Get WhatsApp templates from agent data
  const getWhatsAppTemplates = () => {
    if (!agent || !agent.whatsappTemplates) return [];
    return agent.whatsappTemplates.map((t) => ({
      _id: t.templateId,
      name: t.templateName,
      url: t.templateUrl,
      description: t.description,
      language: t.language,
      status: t.status,
      category: t.category,
      platform: "whatsapp",
    }));
  };

  // Fetch WhatsApp templates from agent's database
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [loadingWhatsappTemplates, setLoadingWhatsappTemplates] =
    useState(false);

  const fetchWhatsappTemplates = async () => {
    try {
      setLoadingWhatsappTemplates(true);
      // Get templates from agent's whatsappTemplates array   (already saved in database)
      if (
        agent &&
        agent.whatsappTemplates &&
        Array.isArray(agent.whatsappTemplates)
      ) {
        const normalized = agent.whatsappTemplates.map((t) => ({
          _id: t.templateId,
          name: t.templateName,
          url: t.templateUrl,
          imageUrl: "", // Not stored in current schema
          description: t.description,
          language: t.language,
          status: t.status,
          category: t.category,
          platform: "whatsapp",
        }));
        setWhatsappTemplates(normalized);
      } else {
        setWhatsappTemplates([]);
      }
    } catch (e) {
      console.error("Error fetching WhatsApp templates:", e);
      setWhatsappTemplates([]);
    } finally {
      setLoadingWhatsappTemplates(false);
    }
  };

  // Fetch WhatsApp templates when agent changes
  useEffect(() => {
    if (agent && agent._id) {
      fetchWhatsappTemplates();
    }
  }, [agent]);

  // Fetch this agent's access requests for status display
  useEffect(() => {
    const loadRequests = async () => {
      try {
        if (!agent || !agent._id) return;
        setLoadingRequests(true);
        const resp = await fetch(
          `${API_BASE_URL}/agent-access/requests?agentId=${agent._id}`
        );
        const json = await resp.json();
        setMyRequests(json?.success ? json.data || [] : []);
      } catch (e) {
        setMyRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };
    loadRequests();
  }, [agent]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVoiceServiceProviderChange = (e) => {
    const { value } = e.target;
    const availableVoices = Object.keys(voiceMappings[value] || {});
    const firstVoice = availableVoices[0] || "";
    
    setFormData((prev) => ({
      ...prev,
      voiceServiceProvider: value,
      voiceSelection: firstVoice,
      voiceId: firstVoice ? voiceMappings[value][firstVoice]?.id || "" : ""
    }));
  };

  const handleVoiceSelectionChange = (e) => {
    const { value } = e.target;
    const selectedVoice = voiceMappings[formData.voiceServiceProvider]?.[value];
    
    setFormData((prev) => ({
      ...prev,
      voiceSelection: value,
      voiceId: selectedVoice?.id || ""
    }));
  };

  const handleAudioRecorded = (audioBlob) => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(",")[1];
        setFormData((prev) => ({ ...prev, audioBase64: base64data }));
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const handleAudioGenerated = async (audioBlob, audioUrl) => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(",")[1];
        setFormData((prev) => ({ ...prev, audioBase64: base64data }));
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  // S3 Upload helper using presigned URL flow
  const uploadCustomizationFile = async (file, targetField, setPreview) => {
    try {
      if (!file) return;
      setPreview && setPreview(URL.createObjectURL(file));
      const authToken =
        clientToken ||
        sessionStorage.getItem("clienttoken") ||
        localStorage.getItem("admintoken");

      const qs = new URLSearchParams({
        fileName: file.name,
        fileType: file.type,
      });
      const resp = await fetch(
        `${API_BASE_URL}/client/upload-url-customization?${qs.toString()}`,
        {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        }
      );
      const data = await resp.json();
      if (!resp.ok || !data?.success || !data?.url || !data?.key) {
        alert("Failed to get upload URL");
        return;
      }

      const putResp = await fetch(data.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResp.ok) {
        alert("Failed to upload file to storage");
        return;
      }

      // Save only the S3 key to DB
      setFormData((prev) => ({ ...prev, [targetField]: data.key }));
    } catch (e) {
      console.error("Upload failed", e);
      alert("Upload failed");
    }
  };

  // Upload KB file using presigned URL and push key into list
  const uploadKnowledgeFile = async (file) => {
    try {
      if (!file) return;
      setUploadingKb(true);
      const authToken =
        clientToken ||
        sessionStorage.getItem("clienttoken") ||
        localStorage.getItem("admintoken");
      const qs = new URLSearchParams({
        fileName: file.name,
        fileType: file.type,
      });
      const resp = await fetch(
        `${API_BASE_URL}/client/upload-url-knowledge-base?${qs.toString()}`,
        { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} }
      );
      const data = await resp.json();
      if (!resp.ok || !data?.success || !data?.url || !data?.key) {
        alert("Failed to get KB upload URL");
        return;
      }
      const putResp = await fetch(data.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResp.ok) {
        alert("Failed to upload KB file");
        return;
      }
      setKnowledgeBaseItems((prev) => [
        ...prev,
        {
          key: data.key,
          name: file.name,
          uploadedAt: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.error("KB upload failed", e);
      alert("KB upload failed");
    } finally {
      setUploadingKb(false);
    }
  };

  // Create knowledge base item
  const createKnowledgeItem = async () => {
    try {
      if (!kbFormData.title.trim()) {
        alert("Title is required");
        return;
      }

      const authToken =
        clientToken ||
        sessionStorage.getItem("clienttoken") ||
        localStorage.getItem("admintoken");

      // If text type, auto-upload textarea to S3 as .txt and set s3Key
      if (selectedKbType === 'text') {
        const hasKey = !!kbFormData?.content?.s3Key;
        const textValue = (kbFormData?.content?.text || '').trim();
        if (!hasKey) {
          if (!textValue) {
            alert('Please enter some text to upload');
            return;
          }
          try {
            const fileName = `${(kbFormData.title || 'text').replace(/\s+/g,'_')}.txt`;
            const fileType = 'text/plain';
            const qs = new URLSearchParams({ fileName, fileType });
            const resp = await fetch(`${API_BASE_URL}/client/upload-url-knowledge-base?${qs.toString()}`, { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
            const up = await resp.json();
            if (!resp.ok || !up?.success || !up?.url || !up?.key) {
              alert('Failed to get upload URL');
              return;
            }
            const blob = new Blob([textValue], { type: fileType });
            const putResp = await fetch(up.url, { method: 'PUT', headers: { 'Content-Type': fileType }, body: blob });
            if (!putResp.ok) {
              alert('Failed to upload text');
              return;
            }
            // Persist s3Key into form data for payload
            kbFormData.content = {
              ...kbFormData.content,
              s3Key: up.key,
              fileMetadata: {
                originalName: fileName,
                fileSize: blob.size,
                mimeType: fileType,
                uploadedAt: new Date().toISOString(),
              },
            };
          } catch (e) {
            console.error('Auto text upload failed', e);
            alert('Text upload failed');
            return;
          }
        }
      }

      const payload = {
        agentId: agent?._id,
        type: selectedKbType,
        title: kbFormData.title,
        description: kbFormData.description,
        // Ensure backend gets s3Key for text type
        content: selectedKbType === 'text'
          ? { s3Key: kbFormData?.content?.s3Key }
          : kbFormData.content,
        tags: []
      };

      const resp = await fetch(`${API_BASE_URL}/client/knowledge-base`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        // Fetch updated knowledge base items from backend
        await fetchKnowledgeBaseItems();
        setKbFormData({ title: '', description: '', content: {} });
        setShowKbModal(false);
        alert("Knowledge item created successfully!");
      } else {
        alert(data.message || "Failed to create knowledge item");
      }
    } catch (e) {
      console.error("Create knowledge item failed", e);
      alert("Failed to create knowledge item");
    }
  };

  const fetchKnowledgeBaseItems = async () => {
    if (!agent?._id) return;
    
    try {
      const authToken =
        clientToken ||
        sessionStorage.getItem("clienttoken") ||
        localStorage.getItem("admintoken");

      const resp = await fetch(`${API_BASE_URL}/client/knowledge-base/${agent._id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      const data = await resp.json();
      if (resp.ok && data.success) {
        setKnowledgeBaseItems(data.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch knowledge base items", e);
    }
  };

  // Trigger embedding for a knowledge base item
  const embedKnowledgeItemReq = async (itemId) => {
    try {
      const authToken =
        clientToken ||
        sessionStorage.getItem("clienttoken") ||
        localStorage.getItem("admintoken");
      const resp = await fetch(`${API_BASE_URL}/client/knowledge-base/${itemId}/embed`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await fetchKnowledgeBaseItems();
        alert("Embedding started/completed successfully.");
      } else {
        alert(data.message || "Failed to embed item");
      }
    } catch (e) {
      console.error("Embedding failed", e);
      alert("Embedding failed");
    }
  };

  // Handle file upload for knowledge base
  const handleKbFileUpload = async (file, type) => {
    try {
      setUploadingKb(true);
      const authToken =
        clientToken ||
        sessionStorage.getItem("clienttoken") ||
        localStorage.getItem("admintoken");
      
      const qs = new URLSearchParams({
        fileName: file.name,
        fileType: file.type,
      });
      
      const resp = await fetch(
        `${API_BASE_URL}/client/upload-url-knowledge-base?${qs.toString()}`,
        { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} }
      );
      
      const data = await resp.json();
      if (!resp.ok || !data?.success || !data?.url || !data?.key) {
        alert("Failed to get upload URL");
        return;
      }
      
      const putResp = await fetch(data.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!putResp.ok) {
        alert("Failed to upload file");
        return;
      }

      // Update form data with the S3 key
      setKbFormData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [type === 'pdf' ? 's3Key' : 'imageKey']: data.key,
          fileMetadata: {
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date().toISOString()
          }
        }
      }));
    } catch (e) {
      console.error("File upload failed", e);
      alert("File upload failed");
    } finally {
      setUploadingKb(false);
    }
  };

  // Extract YouTube ID from URL
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Handle YouTube URL input
  const handleYouTubeUrl = (url) => {
    const youtubeId = extractYouTubeId(url);
    setKbFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        youtubeUrl: url,
        youtubeId: youtubeId
      }
    }));
  };

  const renderCustomizationTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Customization
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Agent Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              uploadCustomizationFile(
                e.target.files?.[0],
                "uiImage",
                setUiImagePreview
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          {uiImagePreview && (
            <div className="mt-3">
              <img
                src={uiImagePreview}
                alt="Agent"
                className="h-24 w-24 object-cover rounded"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Background Color
          </label>
          <input
            type="color"
            name="backgroundColor"
            value={formData.backgroundColor || "#ffffff"}
            onChange={handleInputChange}
            className="w-14 h-10 p-1 border border-gray-300 rounded"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-2 font-semibold text-gray-700">
            Background Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              uploadCustomizationFile(
                e.target.files?.[0],
                "backgroundImage",
                setBackgroundImagePreview
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          {backgroundImagePreview && (
            <div className="mt-3">
              <img
                src={backgroundImagePreview}
                alt="Background"
                className="h-28 w-full object-cover rounded"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleStartingMessageChange = (idx, value) => {
    const newMessages = [...startingMessages];
    newMessages[idx].text = value;
    setStartingMessages(newMessages);
  };

  const handleAudioGeneratedForMessage = (
    idx,
    audioBlob,
    audioUrl,
    audioBase64
  ) => {
    const newMessages = [...startingMessages];
    newMessages[idx].audioBase64 = audioBase64;
    setStartingMessages(newMessages);
  };

  const addStartingMessage = () => {
    setStartingMessages([...startingMessages, { text: "", audioBase64: "" }]);
  };

  const removeStartingMessage = (idx) => {
    if (startingMessages.length > 1) {
      const newMessages = startingMessages.filter((_, index) => index !== idx);
      setStartingMessages(newMessages);
      if (
        defaultStartingMessageIndex >= idx &&
        defaultStartingMessageIndex > 0
      ) {
        setDefaultStartingMessageIndex(defaultStartingMessageIndex - 1);
      }
    }
  };

  const validateCurrentTab = () => {
    switch (selectedTab) {
      case "starting":
        return startingMessages.some((msg) => msg.text.trim() !== "");
      case "personal":
        return (
          formData.agentName.trim() !== "" && formData.description.trim() !== ""
        );
      case "voice":
        return formData.language && formData.voiceSelection;
      case "system":
        return formData.systemPrompt.trim() !== "";
      case "integration":
        return true; // Integration settings are optional
      case "social":
        return true; // Social actions are optional
      case "customization":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentTab()) {
      const currentIndex = tabs.findIndex((tab) => tab.key === selectedTab);
      if (currentIndex < tabs.length - 1) {
        setSelectedTab(tabs[currentIndex + 1].key);
      }
    } else {
      alert("Please fill in all required fields before proceeding.");
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabs.findIndex((tab) => tab.key === selectedTab);
    if (currentIndex > 0) {
      setSelectedTab(tabs[currentIndex - 1].key);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.agentName.trim()) {
        alert("Agent name is required");
        setIsLoading(false);
        return;
      }
      if (!formData.description.trim()) {
        alert("Description is required");
        setIsLoading(false);
        return;
      }
      if (!formData.systemPrompt.trim()) {
        alert("System prompt is required");
        setIsLoading(false);
        return;
      }
      // Ensure default for voiceSelection if empty
      if (!formData.voiceSelection || !formData.voiceSelection.trim()) {
        formData.voiceSelection = "meera";
      }

      // Provider-specific validation: require Account SID and Caller ID for C-zentrix only
      if (
        (formData.serviceProvider || initialServiceProvider) === "c-zentrix"
      ) {
        if (!formData.accountSid.trim()) {
          alert("Account SID is required for C-zentrix");
          setIsLoading(false);
          return;
        }
        if (!formData.callerId.trim()) {
          alert("Caller ID is required for C-zentrix");
          setIsLoading(false);
          return;
        }
      }

      const { serviceProvider, ...formDataWithoutServiceProvider } = formData;
      // Derive socials payload from current selections
      const deriveSocials = () => {
        const platforms = ["whatsapp", "telegram", "email", "sms"];
        const socials = {
          whatsappEnabled: false,
          telegramEnabled: false,
          emailEnabled: false,
          smsEnabled: false,
        };
        const enabledSet = new Set(
          socialMediaLinks.filter((l) => l && l.platform).map((l) => l.platform)
        );
        const linkMap = Object.fromEntries(
          socialMediaLinks
            .filter((l) => l && l.platform)
            .map((l) => [
              l.platform,
              typeof l.url === "string" ? l.url.trim() : "",
            ])
        );
        platforms.forEach((p) => {
          const isEnabled = enabledSet.has(p);
          const url = linkMap[p] || "";
          socials[`${p}Enabled`] = isEnabled;
          if (isEnabled) {
            if (p === "whatsapp") {
              const TEMPLATE_BASE =
                "https://whatsapp-template-module.onrender.com/api/whatsapp/";
              const chosenTemplateName =
                (defaultTemplate && defaultTemplate.templateName) ||
                (Array.isArray(whatsappTemplates) &&
                  whatsappTemplates.find((t) => t.status === "APPROVED")
                    ?.name) ||
                "";
              const constructedUrl = chosenTemplateName
                ? `${TEMPLATE_BASE}send-${chosenTemplateName}`
                : url || "";
              socials[p] = constructedUrl ? [{ link: constructedUrl }] : [];
            } else {
              socials[p] = url ? [{ link: url }] : [];
            }
          }
        });
        return socials;
      };

      const payload = {
        ...formDataWithoutServiceProvider,
        startingMessages,
        defaultStartingMessageIndex,
        firstMessage:
          startingMessages[defaultStartingMessageIndex]?.text ||
          formData.firstMessage,
        defaultTemplate,
        // knowledgeBase is now managed separately via KnowledgeBase model
        depositions,
        // Include voice service provider and voice ID
        voiceServiceProvider: formData.voiceServiceProvider,
        voiceId: formData.voiceId,
        ...deriveSocials(),
      };

      // Preserve the user's original WhatsApp link separately
      try {
        const rawWhatsAppLink = (
          socialMediaLinks.find((l) => l.platform === "whatsapp")?.url || ""
        ).trim();
        if (rawWhatsAppLink) {
          payload.whatsapplink = rawWhatsAppLink;
        }
      } catch {}

      // Ensure S3 keys for customization are included explicitly
      if (typeof formData.uiImage === "string") {
        payload.uiImage = formData.uiImage;
      }
      if (typeof formData.backgroundImage === "string") {
        payload.backgroundImage = formData.backgroundImage;
      }

      // Only add serviceProvider if it's not empty
      if (serviceProvider && serviceProvider.trim() !== "") {
        payload.serviceProvider = serviceProvider;
      }

      // For TATA, omit accountSid and callerId
      if (payload.serviceProvider === "tata") {
        delete payload.accountSid;
        delete payload.callerId;
      }

      const url = agent
        ? `${API_BASE_URL}/client/agents/${agent._id}${
            clientId ? `?clientId=${clientId}` : ""
          }`
        : `${API_BASE_URL}/client/agents${
            clientId ? `?clientId=${clientId}` : ""
          }`;

      const method = agent ? "PUT" : "POST";

      const authToken =
        clientToken ||
        sessionStorage.getItem("clienttoken") ||
        localStorage.getItem("admintoken");
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          agent ? "Agent updated successfully!" : "Agent created successfully!"
        );
        onSave();
      } else {
        alert(`Error: ${result.error || "Failed to save agent"}`);
      }
    } catch (error) {
      console.error("Error saving agent:", error);
      alert("Failed to save agent");
    } finally {
      setIsLoading(false);
    }
  };

  // Save Q&A helper (updates only qa via update-agent admin endpoint when available, else via client agent update)
  const saveAgentQa = async (qaArray) => {
    try {
      // Prefer admin token if present (from either storage)
      const adminToken = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');
      const authToken =
        adminToken ||
        clientToken ||
        sessionStorage.getItem("clienttoken");
      if (!agent || !agent._id) return false;
      // Prefer admin update endpoint if admin token exists (either storage)
      const isAdmin = !!adminToken;
      const url = isAdmin
        ? `${API_BASE_URL}/admin/update-agent/${agent._id}`
        : `${API_BASE_URL}/client/agents/${agent._id}${clientId ? `?clientId=${clientId}` : ''}`;
      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ qa: qaArray })
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success) {
        alert(json?.message || json?.error || 'Failed to save Q&A');
        return false;
      }
      return true;
    } catch (e) {
      alert(e.message || 'Failed to save Q&A');
      return false;
    }
  };

  const renderStartingMessagesTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Starting Messages
      </h3>
      {startingMessages.map((msg, idx) => (
        <div
          key={idx}
          className="p-2 border border-gray-200 rounded-lg bg-white mb-2"
        >
          <div className="flex items-center mb-1">
            <input
              type="radio"
              name="defaultStartingMessage"
              checked={defaultStartingMessageIndex === idx}
              onChange={() => setDefaultStartingMessageIndex(idx)}
              className="mr-2 "
            />
            <span className="text-xs text-gray-600">Set as default</span>
            {startingMessages.length > 1 && (
              <button
                type="button"
                onClick={() => removeStartingMessage(idx)}
                className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <textarea
              value={msg.text}
              onChange={(e) => handleStartingMessageChange(idx, e.target.value)}
              rows="3"
              required
              className="flex-1 px-2 py-5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
              placeholder={`Message ${idx + 1}`}
            />
            <VoiceSynthesizer
              text={msg.text}
              language={formData.language || "en"}
              speaker={formData.voiceSelection}
              serviceProvider={formData.voiceServiceProvider}
              onAudioGenerated={(audioBlob, audioUrl, audioBase64) =>
                handleAudioGeneratedForMessage(
                  idx,
                  audioBlob,
                  audioUrl,
                  audioBase64
                )
              }
              clientId={clientId}
            />
            {msg.audioBase64 && (
              <span className="text-green-600 text-xs ml-1">Audio ready</span>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addStartingMessage}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        + Add Another Message
      </button>
    </div>
  );

  const renderPersonalInfoTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Personal Information
      </h3>

      <div>
        <label
          htmlFor="agentName"
          className="block mb-2 font-semibold text-gray-700"
        >
          Agent Name *
        </label>
        <input
          type="text"
          id="agentName"
          name="agentName"
          value={formData.agentName}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block mb-2 font-semibold text-gray-700"
        >
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="3"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="block mb-2 font-semibold text-gray-700"
        >
          Expert Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          <option value="">Select Expert Category</option>
          <option value="customer-service">Customer Service</option>
          <option value="sales">Sales</option>
          <option value="support">Technical Support</option>
          <option value="marketing">Marketing</option>
          <option value="general">General Assistant</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="personality"
          className="block mb-2 font-semibold text-gray-700"
        >
          Personality (Behaviour)
        </label>
        <select
          id="personality"
          name="personality"
          value={formData.personality}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          <option value="formal">Formal</option>
          <option value="informal">Informal</option>
          <option value="friendly">Friendly</option>
          <option value="flirty">Flirty</option>
          <option value="disciplined">Disciplined</option>
        </select>
      </div>
    </div>
  );

  const renderVoiceConfigTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Voice Configuration
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="language"
            className="block mb-2 font-semibold text-gray-700"
          >
            Language
          </label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="voiceServiceProvider"
            className="block mb-2 font-semibold text-gray-700"
          >
            Voice Service Provider
          </label>
          <select
            id="voiceServiceProvider"
            name="voiceServiceProvider"
            value={formData.voiceServiceProvider}
            onChange={handleVoiceServiceProviderChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="sarvam">Basic</option>
            <option value="elevenlabs">Premium</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="voiceSelection"
          className="block mb-2 font-semibold text-gray-700"
        >
          Voice
        </label>
        <select
          id="voiceSelection"
          name="voiceSelection"
          value={formData.voiceSelection}
          onChange={handleVoiceSelectionChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          {formData.voiceServiceProvider === "sarvam" ? (
            <>
              <optgroup label="Female">
                <option value="anushka">Anushka</option>
                <option value="meera">Meera</option>
                <option value="pavithra">Pavithra</option>
                <option value="maitreyi">Maitreyi</option>
                <option value="diya">Diya</option>
                <option value="misha">Misha</option>
                <option value="maya">Maya</option>
              </optgroup>
              <optgroup label="Male">
                <option value="arvind">Arvind</option>
                <option value="amol">Amol</option>
                <option value="amartya">Amartya</option>
                <option value="neel">Neel</option>
                <option value="vian">Vian</option>
                <option value="arjun">Arjun</option>
              </optgroup>
            </>
          ) : (
            <>
              <optgroup label="Female">
                <option value="monika">Monika</option>
                <option value="kanika">Kanika</option>
              </optgroup>
              <optgroup label="Male">
                <option value="kumaran">Kumaran</option>
                <option value="aahir">Aahir</option>
              </optgroup>
            </>
          )}
        </select>
      </div>
      <div>
        <label className="block mb-2 font-semibold text-gray-700">
          First Message Audio
        </label>
        <div className="mb-4">
          <VoiceSynthesizer
            text={formData.firstMessage}
            language={formData.language}
            speaker={formData.voiceSelection}
            serviceProvider={formData.voiceServiceProvider}
            onAudioGenerated={handleAudioGenerated}
            clientId={clientId}
          />
        </div>
        <div className="mt-4 text-center">
          <AudioRecorder onAudioRecorded={handleAudioRecorded} />
        </div>
        {formData.audioBase64 && (
          <div className="mt-4 text-center">
            <audio
              controls
              src={`data:audio/wav;base64,${formData.audioBase64}`}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );

  const renderSystemConfigTab = () => {
    // Define system configuration sub-tabs with their properties
    const systemSubTabs = [
      {
        id: "prompt",
        name: "System Prompt",
        icon: "🤖",
        color: "bg-blue-500",
        hoverColor: "hover:bg-blue-600",
        description: "Configure agent behavior and instructions"
      },
      {
        id: "qa",
        name: "Q&A",
        icon: "💬", 
        color: "bg-green-500",
        hoverColor: "hover:bg-green-600",
        description: "Manage predefined questions and answers"
      }
    ];
  
    const renderSubTabContent = (subTab) => {
      switch (subTab.id) {
        case "prompt":
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Uncomment these if needed
                <div>
                  <label
                    htmlFor="sttSelection"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Speech-to-Text
                  </label>
                  <select
                    id="sttSelection"
                    name="sttSelection"
                    value={formData.sttSelection}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  >
                    <option value="google">Google Speech-to-Text</option>
                    <option value="azure">Azure Speech Services</option>
                    <option value="aws">AWS Transcribe</option>
                  </select>
                </div>
  
                <div>
                  <label
                    htmlFor="ttsSelection"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Text-to-Speech
                  </label>
                  <select
                    id="ttsSelection"
                    name="ttsSelection"
                    value={formData.ttsSelection}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  >
                    <option value="sarvam">Sarvam AI</option>
                    <option value="elevenlabs">ElevenLabs</option>
                    <option value="azure">Azure Speech Services</option>
                  </select>
                </div>
                */}
              </div>
              
              <div>
                <label
                  htmlFor="systemPrompt"
                  className="block mb-2 font-semibold text-gray-700"
                >
                  System Prompt *
                </label>
                <textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleInputChange}
                  rows="15"
                  required
                  placeholder="Define the agent's behavior, knowledge, and capabilities..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors resize-vertical"
                />
                <small className="block mt-1 text-gray-600 text-sm">
                  This prompt defines how the AI agent should behave and respond to users.
                </small>
              </div>
            </div>
          );
  
        case "qa":
          return (
            <div className="space-y-4">
              {/* Add Q&A Button */}
              {showAddQa && (
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                      <input
                        type="text"
                        value={newQa.question}
                        onChange={(e) => setNewQa(prev => ({ ...prev, question: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter the question"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                      <textarea
                        value={newQa.answer}
                        onChange={(e) => setNewQa(prev => ({ ...prev, answer: e.target.value }))}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter the answer"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button 
                      type="button" 
                      onClick={() => { setShowAddQa(false); setNewQa({ question: '', answer: '' }); }} 
                      className="px-3 py-1.5 text-sm border rounded-md"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      disabled={isSavingQa || !newQa.question.trim() || !newQa.answer.trim()} 
                      onClick={async () => {
                        try {
                          setIsSavingQa(true);
                          const updated = [...qaItems, { question: newQa.question.trim(), answer: newQa.answer.trim() }];
                          const ok = await saveAgentQa(updated);
                          if (ok) {
                            setQaItems(updated);
                            setNewQa({ question: '', answer: '' });
                          }
                        } finally {
                          setIsSavingQa(false);
                        }
                      }} 
                      className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white disabled:opacity-50"
                    >
                      {isSavingQa ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
  
              {/* Empty State */}
              {qaItems.length === 0 && !showAddQa && (
                <div className="p-6 text-center text-gray-500 border border-dashed rounded-lg">
                  No Q&A added yet. Click Add to create one.
                </div>
              )}
  
              {/* Q&A List */}
              <div className="grid grid-cols-1 gap-3">
                {[...qaItems].slice().reverse().map((qa, revIndex, arr) => {
                  const idx = qaItems.length - 1 - revIndex; // map back to original index for edit/delete
                  return (
                  <div key={idx} className="border rounded-lg bg-white p-4 shadow-sm">
                    {editingQaIndex === idx ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
                          <input
                            type="text"
                            value={editingQaDraft.question}
                            onChange={(e) => setEditingQaDraft(prev => ({ ...prev, question: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Answer</label>
                          <textarea
                            rows="3"
                            value={editingQaDraft.answer}
                            onChange={(e) => setEditingQaDraft(prev => ({ ...prev, answer: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button 
                            type="button" 
                            className="px-3 py-1.5 text-sm border rounded" 
                            onClick={() => { setEditingQaIndex(null); }}
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded" 
                            onClick={async () => {
                              const draftQ = (editingQaDraft.question || '').trim();
                              const draftA = (editingQaDraft.answer || '').trim();
                              if (!draftQ || !draftA) return;
                              const updated = qaItems.map((q, i) => i === idx ? { question: draftQ, answer: draftA } : q);
                              if (await saveAgentQa(updated)) {
                                setQaItems(updated);
                                setEditingQaIndex(null);
                              }
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            Q: <span className="font-normal">{qa.question}</span>
                          </div>
                          <div className="text-sm text-gray-800">
                            A: <span className="font-normal whitespace-pre-wrap">{qa.answer}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            title="Edit"
                            className="p-1.5 rounded border hover:bg-gray-50"
                            onClick={() => { setEditingQaIndex(idx); setEditingQaDraft({ question: qa.question, answer: qa.answer }); }}
                          >
                            <FiEdit className="w-3 h-3 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            className="p-1.5 rounded border border-red-300 hover:bg-red-50"
                            onClick={async () => {
                              if (!window.confirm('Delete this Q&A?')) return;
                              const updated = qaItems.filter((_, i) => i !== idx);
                              if (await saveAgentQa(updated)) {
                                setQaItems(updated);
                              }
                            }}
                          >
                            <FiTrash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          );
  
        case "settings":
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="callingType"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Calling Type
                  </label>
                  <select
                    id="callingType"
                    name="callingType"
                    value={formData.callingType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  >
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                    <option value="both">Both</option>
                  </select>
                </div>
  
                <div>
                  <label
                    htmlFor="callingNumber"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Calling Number
                  </label>
                  <input
                    type="text"
                    id="callingNumber"
                    name="callingNumber"
                    value={formData.callingNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your Calling Number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
  
                <div>
                  <label
                    htmlFor="sttSelection"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Speech-to-Text
                  </label>
                  <select
                    id="sttSelection"
                    name="sttSelection"
                    value={formData.sttSelection}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  >
                    <option value="google">Google Speech-to-Text</option>
                    <option value="azure">Azure Speech Services</option>
                    <option value="aws">AWS Transcribe</option>
                  </select>
                </div>
  
                <div>
                  <label
                    htmlFor="ttsSelection"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Text-to-Speech
                  </label>
                  <select
                    id="ttsSelection"
                    name="ttsSelection"
                    value={formData.ttsSelection}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  >
                    <option value="sarvam">Sarvam AI</option>
                    <option value="elevenlabs">ElevenLabs</option>
                    <option value="azure">Azure Speech Services</option>
                  </select>
                </div>
              </div>
  
              {/* Integration Settings */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Integration Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="X_API_KEY"
                      className="block mb-2 font-semibold text-gray-700"
                    >
                      X API Key
                    </label>
                    <input
                      type="password"
                      id="X_API_KEY"
                      name="X_API_KEY"
                      value={formData.X_API_KEY}
                      onChange={handleInputChange}
                      placeholder="Enter X API Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    />
                  </div>
  
                  {(!formData.serviceProvider || formData.serviceProvider !== "tata") && (
                    <>
                      <div>
                        <label
                          htmlFor="accountSid"
                          className="block mb-2 font-semibold text-gray-700"
                        >
                          Account SID
                        </label>
                        <input
                          type="text"
                          id="accountSid"
                          name="accountSid"
                          value={formData.accountSid}
                          onChange={handleInputChange}
                          placeholder="Enter your account SID"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                        />
                      </div>
  
                      <div>
                        <label
                          htmlFor="callerId"
                          className="block mb-2 font-semibold text-gray-700"
                        >
                          Caller ID
                        </label>
                        <input
                          type="text"
                          id="callerId"
                          name="callerId"
                          value={formData.callerId}
                          onChange={handleInputChange}
                          placeholder="Enter caller ID (phone number)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
  
        default:
          return <div>Invalid sub-tab</div>;
      }
    };
  
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            System Configuration
          </h3>
          <div className="text-sm text-gray-500">
            Configure system behavior, Q&A, and integration settings
          </div>
        </div>
  
        {/* Sub-tab Navigation */}
        <div className="flex gap-1 mb-6">
          {systemSubTabs.map((subTab) => (
            <button
              key={subTab.id}
              type="button"
              onClick={() => {
                setSystemSubTab(subTab.id);
                // Reset add Q&A form when switching tabs
                if (subTab.id !== 'qa') {
                  setShowAddQa(false);
                  setNewQa({ question: '', answer: '' });
                }
              }}
              className={`flex-1 py-3 px-4 rounded-t-lg font-medium transition-all duration-200 ${
                systemSubTab === subTab.id
                  ? `${subTab.color} text-white shadow-sm`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{subTab.icon}</span>
                <span className="text-sm">{subTab.name}</span>
              </div>
            </button>
          ))}
          
          {/* Add button for Q&A tab */}
          {systemSubTab === 'qa' && (
            <button
              type="button"
              onClick={() => { setShowAddQa(true); setNewQa({ question: '', answer: '' }); }}
              className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm hover:from-indigo-700 hover:to-indigo-800"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
              </svg>
              Add
            </button>
          )}
        </div>
  
        {/* Tab Content */}
        <div 
          className="border border-gray-200 rounded-b-lg bg-white"
          style={{ maxHeight: "600px", overflowY: "auto" }}
        >
          <div className="p-6">
            {renderSubTabContent(
              systemSubTabs.find((st) => st.id === systemSubTab)
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderKnowledgeBaseTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">
          Knowledge Base
        </h3>
        <button
          type="button"
          onClick={() => setShowKbModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Content
        </button>
      </div>

      {/* Existing Knowledge Items */}
      <div>
        {knowledgeBaseItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-2">No knowledge items added</p>
            <p className="text-sm">Click "Add Content" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledgeBaseItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.type === 'pdf' ? 'bg-red-100 text-red-700' :
                      item.type === 'image' ? 'bg-green-100 text-green-700' :
                      item.type === 'youtube' ? 'bg-red-100 text-red-700' :
                      item.type === 'link' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'text' ? 'bg-gray-100 text-gray-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.type ? item.type.toUpperCase() : 'FILE'}
                    </span>
                    {item.isEmbedded && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Embedded</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-red-600 text-sm hover:text-red-800"
                    onClick={() =>
                      setKnowledgeBaseItems((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{item.title || item.name || item.key}</h4>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {item.type === 'text' && '📝 Text Content'}
                    {item.type === 'pdf' && '📄 PDF Document'}
                    {item.type === 'image' && '🖼️ Image'}
                    {item.type === 'youtube' && '🎥 YouTube Video'}
                    {item.type === 'link' && '🔗 External Link'}
                    {!item.type && '📄 File'}
                  </span>
                  <div className="flex items-center gap-3">
                    {(item.type === 'pdf' || item.type === 'image' || item.type === 'text' || !item.type) && (item.content?.s3Key || item.key) && (
                      <a
                        href={`${API_BASE_URL}/client/file-url?key=${encodeURIComponent(item.content?.s3Key || item.key)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        View
                      </a>
                    )}
                    {(item.type === 'pdf' || item.type === 'image' || item.type === 'text' || item.type === 'link' || item.type === 'website' || item.type === 'youtube') && !item.isEmbedded && (
                      <button
                        type="button"
                        onClick={() => embedKnowledgeItemReq(item._id)}
                        className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                      >
                        Embed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderKnowledgeBaseModal = () => (
    showKbModal && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Dark transparent overlay */}
        <div 
          className="absolute inset-0 bg-opacity-50 backdrop-blur-sm" 
          onClick={() => setShowKbModal(false)}
        ></div>
        
        {/* Modal content */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 z-10">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Add Content</h2>
            </div>
            <button
              onClick={() => setShowKbModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
  
          {/* Content Type Selection */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-2 overflow-x-auto">
              {[
                { type: 'text', label: 'Text', icon: '📝' },
                { type: 'image', label: 'Image', icon: '🖼️' },
                { type: 'youtube', label: 'YouTube', icon: '📺' },
                { type: 'link', label: 'Link', icon: '🔗' },
                { type: 'website', label: 'Website', icon: '🌐' },
                { type: 'pdf', label: 'PDF', icon: '📄' }
              ].map((contentType) => (
                <button
                  key={contentType.type}
                  onClick={() => {
                    setSelectedKbType(contentType.type);
                    setKbFormData({ title: '', description: '', content: {} });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${
                    selectedKbType === contentType.type
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{contentType.icon}</span>
                  <span className="font-medium">{contentType.label}</span>
                </button>
              ))}
            </div>
          </div>
  
          {/* Modal Content */}
          <div className="p-6">
            {/* Title Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={kbFormData.title}
                onChange={(e) => setKbFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
  
            {/* Content based on type */}
            <div className="mb-6">
              {selectedKbType === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Content
                  </label>
                  <textarea
                    value={kbFormData.content.text || ''}
                    onChange={(e) => setKbFormData(prev => ({ 
                      ...prev, 
                      content: { ...prev.content, text: e.target.value }
                    }))}
                    placeholder="Enter your text content here..."
                    rows="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
  
              {selectedKbType === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleKbFileUpload(e.target.files?.[0], 'image')}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-lg font-medium text-gray-700 mb-2">Upload from your device</p>
                      <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                    </label>
                  </div>
                  {kbFormData.content.imageKey && (
                    <div className="mt-3 text-sm text-green-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Image uploaded successfully
                    </div>
                  )}
                </div>
              )}
  
              {selectedKbType === 'youtube' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={kbFormData.content.youtubeUrl || ''}
                    onChange={(e) => handleYouTubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {kbFormData.content.youtubeId && (
                    <div className="mt-3 text-sm text-green-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      YouTube video detected
                    </div>
                  )}
                </div>
              )}
  
              {selectedKbType === 'link' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL
                    </label>
                    <input
                      type="url"
                      value={kbFormData.content.url || ''}
                      onChange={(e) => setKbFormData(prev => ({ 
                        ...prev, 
                        content: { ...prev.content, url: e.target.value }
                      }))}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Text
                    </label>
                    <input
                      type="text"
                      value={kbFormData.content.linkText || ''}
                      onChange={(e) => setKbFormData(prev => ({ 
                        ...prev, 
                        content: { ...prev.content, linkText: e.target.value }
                      }))}
                      placeholder="Display text for the link"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
  
              {selectedKbType === 'website' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={kbFormData.content.url || ''}
                    onChange={(e) => setKbFormData(prev => ({ 
                      ...prev, 
                      content: { ...prev.content, url: e.target.value }
                    }))}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
  
              {selectedKbType === 'pdf' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleKbFileUpload(e.target.files?.[0], 'pdf')}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-lg font-medium text-gray-700 mb-2">Upload from your device</p>
                      <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                    </label>
                  </div>
                  {kbFormData.content.s3Key && (
                    <div className="mt-3 text-sm text-green-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      PDF uploaded successfully
                    </div>
                  )}
                </div>
              )}
            </div>
  
            {/* Description Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={kbFormData.description}
                onChange={(e) => setKbFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter a description..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
  
          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => setShowKbModal(false)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              onClick={createKnowledgeItem}
              disabled={uploadingKb || !kbFormData.title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {uploadingKb ? 'Uploading...' : 'Save Content'}
            </button>
          </div>
        </div>
      </div>
    )
  );

  const renderDepositionsTab = () => {
    // Fixed main depositions from DB; allow only sub items to be dynamic
    const removeMain = (i) => {
      // Prevent removing default main depositions
      alert("Main depositions are fixed and managed by admin");
    };
    const addSub = (i) =>
      setDepositions((prev) =>
        prev.map((d, idx) =>
          idx === i ? { ...d, sub: [...(d.sub || []), ""] } : d
        )
      );
    const updateSub = (i, j, val) =>
      setDepositions((prev) =>
        prev.map((d, idx) =>
          idx === i
            ? { ...d, sub: d.sub.map((s, jj) => (jj === j ? val : s)) }
            : d
        )
      );
    const removeSub = (i, j) =>
      setDepositions((prev) =>
        prev.map((d, idx) =>
          idx === i ? { ...d, sub: d.sub.filter((_, jj) => jj !== j) } : d
        )
      );

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Dispositions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {depositions.map((d, i) => (
            <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-gray-800">{d.title}</div>
                <button
                  type="button"
                  onClick={() => addSub(i)}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded text-sm hover:bg-indigo-100"
                >
                  + Add sub-deposition
                </button>
              </div>
              <div className="space-y-2">
                {(d.sub || []).map((s, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={s}
                      onChange={(e) => updateSub(i, j, e.target.value)}
                      placeholder="Sub-deposition"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      className="text-gray text-xs"
                      onClick={() => removeSub(i, j)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // const renderIntegrationSettingsTab = () => (
  //   <div className="space-y-6">
  //     <h3 className="text-xl font-semibold text-gray-800 mb-4">
  //       Integration Settings
  //     </h3>

  //     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //       {/* <div>
  //         <label
  //           htmlFor="serviceProvider"
  //           className="block mb-2 font-semibold text-gray-700"
  //         >
  //           Service Provider
  //         </label>
  //         <select
  //           id="serviceProvider"
  //           name="serviceProvider"
  //           value={formData.serviceProvider}
  //           onChange={handleInputChange}
  //           disabled={lockServiceProvider}
  //           className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
  //             lockServiceProvider ? "bg-gray-100 cursor-not-allowed" : ""
  //           }`}
  //         >
  //           <option value="">Select Provider</option>
  //           <option value="c-zentrix">C-zentrix</option>
  //           <option value="tata">TATA</option>
  //           <option value="twilio">Twilio</option>
  //           <option value="vonage">Vonage</option>
  //           <option value="aws">AWS Connect</option>
  //         </select>
  //       </div> */}

  //       <div>
  //         <label
  //           htmlFor="X_API_KEY"
  //           className="block mb-2 font-semibold text-gray-700"
  //         >
  //           X API Key
  //         </label>
  //         <input
  //           type="password"
  //           id="X_API_KEY"
  //           name="X_API_KEY"
  //           value={formData.X_API_KEY}
  //           onChange={handleInputChange}
  //           placeholder="Enter X API Key"
  //           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
  //         />
  //       </div>

  //       <div>
  //         {(!formData.serviceProvider ||
  //           formData.serviceProvider !== "tata") && (
  //           <>
  //             <label
  //               htmlFor="accountSid"
  //               className="block mb-2 font-semibold text-gray-700"
  //             >
  //               Account SID
  //             </label>
  //             <input
  //               type="text"
  //               id="accountSid"
  //               name="accountSid"
  //               value={formData.accountSid}
  //               onChange={handleInputChange}
  //               placeholder="Enter your account SID"
  //               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
  //             />
  //           </>
  //         )}
  //       </div>

  //       <div>
  //         {(!formData.serviceProvider ||
  //           formData.serviceProvider !== "tata") && (
  //           <>
  //             <label
  //               htmlFor="callerId"
  //               className="block mb-2 font-semibold text-gray-700"
  //             >
  //               Caller ID
  //             </label>
  //             <input
  //               type="text"
  //               id="callerId"
  //               name="callerId"
  //               value={formData.callerId}
  //               onChange={handleInputChange}
  //               placeholder="Enter caller ID (phone number)"
  //               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
  //             />
  //           </>
  //         )}
  //       </div>
  //     </div>
  //   </div>
  // );

  const renderSocialMediaTab = () => {
    // Define social media platforms with their icons and colors
    const socialPlatforms = [
      {
        id: "whatsapp",
        name: "WhatsApp",
        icon: "📱",
        color: "bg-green-500",
        hoverColor: "hover:bg-green-600",
        placeholder: "https://wa.me/1234567890",
      },
      {
        id: "telegram",
        name: "Telegram",
        icon: "✈️",
        color: "bg-blue-500",
        hoverColor: "hover:bg-blue-600",
        placeholder: "https://t.me/username",
      },
      {
        id: "email",
        name: "Email",
        icon: <FiMail />,
        color: "bg-red-500",
        hoverColor: "hover:bg-red-600",
        placeholder: "mailto:example@email.com",
      },
      {
        id: "sms",
        name: "SMS",
        icon: <FiMessageSquare />,
        color: "bg-purple-500",
        hoverColor: "hover:bg-purple-600",
        placeholder: "sms:+1234567890",
      },
    ];

    const renderPlatformContent = (platform) => {
      const isEnabled = socialMediaLinks.some(
        (link) => link.platform === platform.id
      );
      const currentLink = socialMediaLinks.find(
        (link) => link.platform === platform.id
      );

      // Determine latest request status for this platform
      const requestsForPlatform = myRequests.filter(
        (r) => r.platform === platform.id
      );
      const latestReq =
        requestsForPlatform.length > 0
          ? requestsForPlatform.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )[0]
          : null;
      const status = latestReq?.status; // 'pending' | 'approved' | 'rejected'
      const approvedTemplateName = latestReq?.templateName;

      // Get assigned templates for this platform - only show approved templates
      const assignedTemplatesForPlatform =
        platform.id === "whatsapp"
          ? whatsappTemplates.filter((t) => t.status === "APPROVED")
          : assignedTemplates.filter(
              (t) => t.platform === platform.id && t.status === "APPROVED"
            );

      return (
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 ${platform.color} rounded-full flex items-center justify-center text-white text-sm shadow-sm`}
              >
                {platform.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{platform.name}</h4>
                {/* Status indicators */}
                {platform.id === "whatsapp" && status && (
                  <div className="flex items-center gap-1 mt-1">
                    {status === "pending" && (
                      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
                        Pending
                      </span>
                    )}
                    {status === "approved" && (
                      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Approved
                      </span>
                    )}
                    {status === "rejected" && (
                      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                        Rejected
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {isEnabled ? "Enabled" : "Disabled"}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSocialMediaLinks([
                        ...socialMediaLinks,
                        {
                          platform: platform.id,
                          url: "",
                        },
                      ]);
                    } else {
                      setSocialMediaLinks(
                        socialMediaLinks.filter(
                          (link) => link.platform !== platform.id
                        )
                      );
                    }
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    isEnabled ? platform.color : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`dot absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>

          {/* Content when enabled */}
          {isEnabled && (
            <div className="space-y-4">
              {/* Show approved WhatsApp link if available */}
              {platform.id === "whatsapp" &&
                agent?.whatsapplink &&
                status === "approved" && (
                  <div className="p-4 rounded border border-green-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 mb-1">
                          Approved Template
                          {approvedTemplateName
                            ? `: ${approvedTemplateName}`
                            : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ml-2 px-3 py-1 text-white text-sm rounded bg-green-600 hover:bg-green-700 transition-colors"
                        onClick={() => {
                          const next = socialMediaLinks.map((l) =>
                            l.platform === "whatsapp"
                              ? { ...l, url: agent.whatsapplink }
                              : l
                          );
                          if (!next.find((l) => l.platform === "whatsapp")) {
                            next.push({
                              platform: "whatsapp",
                              url: agent.whatsapplink,
                            });
                          }
                          setSocialMediaLinks(next);
                        }}
                      >
                        Use
                      </button>
                    </div>
                  </div>
                )}

              {/* Show assigned templates if available */}
              {assignedTemplatesForPlatform.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                    Templates ({assignedTemplatesForPlatform.length})
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {assignedTemplatesForPlatform.map((t) => (
                      <div
                        key={t._id}
                        className={`border rounded-lg p-4 bg-white hover:shadow-sm transition-all ${
                          defaultTemplate &&
                          defaultTemplate.templateId === t._id
                            ? "ring-2 ring-blue-500 bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            {t.imageUrl && (
                              <img
                                src={t.imageUrl}
                                alt={t.name}
                                className="w-12 h-12 object-cover rounded flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900 text-lg truncate">
                                  {t.name}
                                </div>
                                {defaultTemplate &&
                                  defaultTemplate.templateId === t._id && (
                                    <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                      Default
                                    </span>
                                  )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {t.status && (
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      t.status === "APPROVED"
                                        ? "bg-green-100 text-green-700"
                                        : t.status === "PENDING"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {t.status}
                                  </span>
                                )}
                                {t.language && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                    {t.language}
                                  </span>
                                )}
                                {t.category && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                    {t.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDefaultTemplate({
                                  templateId: t._id,
                                  templateName: t.name,
                                  templateUrl: t.url,
                                  platform: platform.id,
                                });
                              }}
                              className={`flex-shrink-0 px-3 py-1 text-xs rounded transition-colors ${
                                defaultTemplate &&
                                defaultTemplate.templateId === t._id
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {defaultTemplate &&
                              defaultTemplate.templateId === t._id
                                ? "Default"
                                : "Set Default"}
                            </button>
                          </div>
                        </div>

                        {t.description && (
                          <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap line-clamp-3">
                            {t.description}
                          </div>
                        )}

                        {t.url &&
                          !t.url.includes(
                            "whatsapp-template-module.onrender.com"
                          ) && (
                            <div className="flex items-center justify-between">
                              <a
                                href={t.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-blue-600 hover:underline"
                              >
                                View Template Link
                                <svg
                                  className="w-4 h-4 ml-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                              {t.parameter_format && (
                                <span className="text-xs text-gray-500">
                                  Format: {t.parameter_format}
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading state for WhatsApp templates */}
              {platform.id === "whatsapp" && loadingWhatsappTemplates && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">
                    Loading templates...
                  </p>
                </div>
              )}

              {/* Show contact admin and request buttons (always show for WhatsApp) */}
              {platform.id === "whatsapp" && (
                <div className="p-4 rounded border border-dashed border-gray-300 bg-white">
                  <div className="text-sm text-gray-700 mb-2">
                    Need more templates? Contact admin to get access.
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="https://web.whatsapp.com/send/?phone=8147540362&text=I%20want%20to%20enable%20my%20business%20with%20Aitota.%20My%20name%20is"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center px-3 py-2 text-white text-sm rounded ${platform.color} ${platform.hoverColor} transition-colors`}
                    >
                      Contact Admin
                    </a>
                    <button
                      type="button"
                      disabled={
                        requesting || !agent?._id || status === "pending"
                      }
                      onClick={async () => {
                        try {
                          setRequesting(true);
                          const authToken =
                            clientToken ||
                            sessionStorage.getItem("clienttoken") ||
                            localStorage.getItem("admintoken");
                          const resp = await fetch(
                            `${API_BASE_URL}/agent-access/request`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${authToken}`,
                              },
                              body: JSON.stringify({
                                clientId: clientId || agent?.clientId || "",
                                agentId: agent?._id,
                                platform: "whatsapp",
                              }),
                            }
                          );
                          const json = await resp.json();
                          if (json.success) {
                            alert(
                              "Request submitted! Admin will review and approve."
                            );
                            // refresh requests
                            try {
                              const r = await fetch(
                                `${API_BASE_URL}/agent-access/requests?agentId=${agent._id}`
                              );
                              const rj = await r.json();
                              setMyRequests(rj?.success ? rj.data || [] : []);
                            } catch {}
                          } else {
                            alert(json.message || "Failed to submit request");
                          }
                        } catch (e) {
                          alert("Failed to submit request");
                        } finally {
                          setRequesting(false);
                        }
                      }}
                      className={`px-3 py-2 text-white text-sm rounded bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
                    >
                      {status === "pending"
                        ? "Requested"
                        : requesting
                        ? "Requesting..."
                        : "Request"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Action Integration
          </h3>
          <div className="text-sm text-gray-500">
            Enable platforms and manage templates for your agent
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-1 mb-6">
          {socialPlatforms.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => setSelectedSocialTab(platform.id)}
              className={`flex-1 py-3 px-4 rounded-t-lg font-medium transition-all duration-200 ${
                selectedSocialTab === platform.id
                  ? `${platform.color} text-white shadow-sm`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{platform.icon}</span>
                <span className="text-sm">{platform.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          className="border border-gray-200 rounded-b-lg bg-white"
          style={{ maxHeight: "600px", overflowY: "auto" }}
        >
          <div className="p-6">
            {renderPlatformContent(
              socialPlatforms.find((p) => p.id === selectedSocialTab)
            )}
          </div>
        </div>
      </div>
    );
  };

  const addSocialMediaLink = () => {
    setSocialMediaLinks([...socialMediaLinks, { platform: "", url: "" }]);
  };

  const removeSocialMediaLink = (index) => {
    if (socialMediaLinks.length > 1) {
      const newLinks = socialMediaLinks.filter((_, i) => i !== index);
      setSocialMediaLinks(newLinks);
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "starting":
        return renderStartingMessagesTab();
      case "personal":
        return renderPersonalInfoTab();
      case "voice":
        return renderVoiceConfigTab();
      case "system":
        return renderSystemConfigTab();
      // case "integration":
      //   return renderIntegrationSettingsTab();
      case "social":
        return renderSocialMediaTab();
      case "customization":
        return renderCustomizationTab();
      case "knowledge":
        return renderKnowledgeBaseTab();
      case "dispositions":
        return renderDepositionsTab();
      default:
        return renderStartingMessagesTab();
    }
  };

  const isLastTab = selectedTab === tabs[tabs.length - 1].key;
  const isFirstTab = selectedTab === tabs[0].key;

  return (
    <div className="bg-white rounded-lg shadow-lg w-[90%] mx-auto">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {agent ? "Edit Agent" : "Create New Agent"}
        </h2>
      </div>

      <form>
        <div className="flex">
          {/* Tab Navigation */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`w-full py-4 px-6 text-left font-medium transition-all duration-200 ${
                  selectedTab === tab.key
                    ? "bg-white border-r-4 border-indigo-500 text-indigo-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
                onClick={() => setSelectedTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div
            className="flex-1 p-8"
            style={{ overflowY: "auto", maxHeight: "80vh" }}
          >
            <div className="max-w-4xl">{renderTabContent()}</div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-4 justify-between">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {!isFirstTab && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex gap-4">
              {!isLastTab ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all hover:-translate-y-1"
                >
                  {isLoading
                    ? "Saving..."
                    : agent
                    ? "Update Agent"
                    : "Create Agent"}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
      
      {/* Knowledge Base Modal */}
      {renderKnowledgeBaseModal()}
    </div>
  );
};

export default AgentForm;