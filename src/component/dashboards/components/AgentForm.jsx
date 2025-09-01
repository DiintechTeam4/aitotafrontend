"use client";
import { FiMail, FiMessageSquare, FiEye, FiTrash2, FiRotateCcw, FiHelpCircle, FiCalendar, FiMoreVertical } from "react-icons/fi";
import { FaWhatsapp, FaTelegram } from "react-icons/fa";
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
    voiceSelection: "anushka",
    accountSid: "",
    serviceProvider: "",
    callingType: "both",
    callingNumber: "",
    callerId: "",
    X_API_KEY: "",
    audioBase64: "",
  });

  const [startingMessages, setStartingMessages] = useState([
    { text: "", audioBase64: "" },
  ]);
  const [defaultStartingMessageIndex, setDefaultStartingMessageIndex] =
    useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [socialMediaLinks, setSocialMediaLinks] = useState([
    { platform: "", url: "" },
  ]);
  const [assignedTemplates, setAssignedTemplates] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState(null);
  const [requestReason, setRequestReason] = useState("");
  const [viewTemplateModal, setViewTemplateModal] = useState({ open: false, template: null });
  const [templateListTab, setTemplateListTab] = useState('available');
  const [templateFilter, setTemplateFilter] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('');
  const [calendarTemplates, setCalendarTemplates] = useState([
    {
      _id: '1',
      name: 'Business Meeting Schedule',
      description: 'Calendar for scheduling business meetings and appointments',
      link: 'https://calendar.google.com/calendar/embed?src=business@company.com',
      platform: 'calendar'
    },
    {
      _id: '2', 
      name: 'Team Availability',
      description: 'Track team member availability and working hours',
      link: 'https://calendar.google.com/calendar/embed?src=team@company.com',
      platform: 'calendar'
    }
  ]);
  const [addTemplateModal, setAddTemplateModal] = useState({ open: false, platform: '' });
  const [newTemplateData, setNewTemplateData] = useState({ description: '', link: '' });

  const tabs = [
    { key: "starting", label: "Starting Messages" },
    { key: "personal", label: "Personal Information" },
    { key: "voice", label: "Voice Configuration" },
    { key: "system", label: "System Configuration" },
    { key: "integration", label: "Telephony Settings" },
    { key: "social", label: "Action" },
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
        callingNumber: agent.callingNumber || "",
        callingType: agent.callingType || "both",
        voiceSelection: agent.voiceSelection || "anushka",
        accountSid: agent.accountSid || "",
        serviceProvider: agent.serviceProvider || "",
        callerId: agent.callerId || "",
        X_API_KEY: agent.X_API_KEY || "",
        audioBase64: agent.audioBase64 || "",
      });

      // Load starting messages if they exist
      if (agent.startingMessages && agent.startingMessages.length > 0) {
        setStartingMessages(agent.startingMessages);
        setDefaultStartingMessageIndex(agent.defaultStartingMessageIndex || 0);
      }
    }
  }, [agent]);

  // Hydrate social links from agent record when available
  useEffect(() => {
    if (!agent) return;
    const hydrated = [];
    
    // Handle WhatsApp with automatic default selection
    if (agent.whatsappEnabled) {
      const wa = agent.whatsapplink || (Array.isArray(agent.whatsapp) && agent.whatsapp[0]?.link) || "";
      if (wa) {
        hydrated.push({ platform: "whatsapp", url: wa });
      } else {
        // Check if there's only one WhatsApp template, make it default
        const whatsappTemplates = agent.whatsappTemplates || [];
        if (whatsappTemplates.length === 1) {
          // Generate WhatsApp template module URL format
          const base = 'https://whatsapp-template-module.onrender.com/api/whatsapp/send';
          const suffix = whatsappTemplates[0].templateName ? `-${whatsappTemplates[0].templateName}` : '';
          const whatsappUrl = base + suffix;
          hydrated.push({ platform: "whatsapp", url: whatsappUrl });
        } else {
          // If WhatsApp is enabled but no URL, still add it with empty URL
          hydrated.push({ platform: "whatsapp", url: "" });
        }
      }
      
      // Set default template if available
      if (agent.defaultTemplate) {
        setDefaultTemplate(agent.defaultTemplate);
      }
    }
    
    // Handle other platforms consistently
    if (agent.telegramEnabled) {
      const telegramUrl = Array.isArray(agent.telegram) && agent.telegram[0]?.link ? agent.telegram[0].link : "";
      hydrated.push({ platform: "telegram", url: telegramUrl });
    }
    if (agent.emailEnabled) {
      const emailUrl = Array.isArray(agent.email) && agent.email[0]?.link ? agent.email[0].link : "";
      hydrated.push({ platform: "email", url: emailUrl });
    }
    if (agent.smsEnabled) {
      const smsUrl = Array.isArray(agent.sms) && agent.sms[0]?.link ? agent.sms[0].link : "";
      hydrated.push({ platform: "sms", url: smsUrl });
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
      fetchAudio(agent._id);
    }
  }, [agent, clientId]);

  // Fetch templates assigned to this agent (admin assigns)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        if (!agent || !agent._id) return;
        const resp = await fetch(`${API_BASE_URL}/templates/agent/${agent._id}`);
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
    return agent.whatsappTemplates.map(t => ({
      _id: t.templateId,
      name: t.templateName,
      url: t.templateUrl,
      description: t.description,
      language: t.language,
      status: t.status,
      category: t.category,
      platform: 'whatsapp'
    }));
  };

  // Fetch WhatsApp templates from agent's database
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [loadingWhatsappTemplates, setLoadingWhatsappTemplates] = useState(false);

  const fetchWhatsappTemplates = async () => {
    try {
      setLoadingWhatsappTemplates(true);
      
      // Fetch fresh agent data from server to get updated templates
      if (agent && agent._id) {
        const authToken = clientToken || sessionStorage.getItem("clienttoken") || localStorage.getItem("admintoken");
        const resp = await fetch(`${API_BASE_URL}/client/agents/${agent._id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        
        if (resp.ok) {
          const agentData = await resp.json();
          if (agentData.success && agentData.data) {
            const freshAgent = agentData.data;
            if (freshAgent.whatsappTemplates && Array.isArray(freshAgent.whatsappTemplates)) {
              const normalized = freshAgent.whatsappTemplates.map(t => ({
                _id: t.templateId,
                name: t.templateName,
                url: t.templateUrl,
                imageUrl: '', // Not stored in current schema
                description: t.description,
                language: t.language,
                status: t.status,
                category: t.category,
                platform: 'whatsapp',
                assignedAt: t.assignedAt
              }));
              console.log('Fetched fresh WhatsApp templates:', normalized);
              setWhatsappTemplates(normalized);
            } else {
              console.log('No WhatsApp templates found for agent');
              setWhatsappTemplates([]);
            }
          } else {
            console.log('Failed to fetch agent data');
            setWhatsappTemplates([]);
          }
        } else {
          console.log('Failed to fetch agent data from server');
          setWhatsappTemplates([]);
        }
      } else {
        console.log('No agent ID available');
        setWhatsappTemplates([]);
      }
    } catch (e) {
      console.error('Error fetching WhatsApp templates:', e);
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
        const resp = await fetch(`${API_BASE_URL}/agent-access/requests?agentId=${agent._id}`);
        const json = await resp.json();
        setMyRequests(json?.success ? (json.data || []) : []);
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
      if (!formData.callingNumber.trim()) {
        alert("Calling number is required");
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
        formData.voiceSelection = "anushka";
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

      // Create payload without empty serviceProvider
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
        
        // Check if platform is enabled (exists in socialMediaLinks)
        platforms.forEach((p) => {
          const platformExists = socialMediaLinks.some((l) => l && l.platform === p);
          socials[`${p}Enabled`] = platformExists;
          
          if (platformExists) {
            // Get the URL for this platform
            const platformLink = socialMediaLinks.find((l) => l && l.platform === p);
            const url = platformLink?.url?.trim() || "";
            
            // Only add the social array if there's a valid URL
            if (url) {
              socials[p] = [{ link: url }];
            }
          }
        });
        
        return socials;
      };

      const socialsData = deriveSocials();
      console.log('🔧 Social media data being sent:', {
        socialMediaLinks,
        derivedSocials: socialsData
      });
      
      const payload = {
        ...formDataWithoutServiceProvider,
        startingMessages,
        defaultStartingMessageIndex,
        firstMessage:
          startingMessages[defaultStartingMessageIndex]?.text ||
          formData.firstMessage,
        defaultTemplate,
        ...socialsData,
      };

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
            htmlFor="voiceSelection"
            className="block mb-2 font-semibold text-gray-700"
          >
            Voice
          </label>
          <select
            id="voiceSelection"
            name="voiceSelection"
            value={formData.voiceSelection}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="anushka">Anushka</option>
            <option value="meera">Meera</option>
            <option value="pavithra">Pavithra</option>
            <option value="maitreyi">Maitreyi</option>
            <option value="arvind">Arvind</option>
            <option value="amol">Amol</option>
            <option value="amartya">Amartya</option>
            <option value="diya">Diya</option>
            <option value="neel">Neel</option>
            <option value="misha">Misha</option>
            <option value="vian">Vian</option>
            <option value="arjun">Arjun</option>
            <option value="maya">Maya</option>
            <option value="male-professional">Male Professional</option>
            <option value="female-professional">Female Professional</option>
            <option value="male-friendly">Male Friendly</option>
            <option value="female-friendly">Female Friendly</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
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

  const renderSystemConfigTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        System Configuration
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* <div>
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
        </div> */}

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
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="systemPrompt"
          className="block mb-2 font-semibold text-gray-700"
        >
          System Prompt
        </label>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          value={formData.systemPrompt}
          onChange={handleInputChange}
          rows="12"
          required
          placeholder="Define the agent's behavior, knowledge, and capabilities..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors resize-vertical"
        />
        <small className="block mt-1 text-gray-600 text-sm">
          This prompt defines how the AI agent should behave and respond to
          users.
        </small>
      </div>
    </div>
  );

  const renderIntegrationSettingsTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Integration Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* <div>
          <label
            htmlFor="serviceProvider"
            className="block mb-2 font-semibold text-gray-700"
          >
            Service Provider
          </label>
          <select
            id="serviceProvider"
            name="serviceProvider"
            value={formData.serviceProvider}
            onChange={handleInputChange}
            disabled={lockServiceProvider}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              lockServiceProvider ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          >
            <option value="">Select Provider</option>
            <option value="c-zentrix">C-zentrix</option>
            <option value="tata">TATA</option>
            <option value="twilio">Twilio</option>
            <option value="vonage">Vonage</option>
            <option value="aws">AWS Connect</option>
          </select>
        </div> */}

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

        <div>
          {(!formData.serviceProvider ||
            formData.serviceProvider !== "tata") && (
            <>
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
            </>
          )}
        </div>

        <div>
          {(!formData.serviceProvider ||
            formData.serviceProvider !== "tata") && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderSocialMediaTab = () => {
    // Define social media platforms with their icons and colors
    const socialPlatforms = [
      {
        id: "whatsapp",
        name: "WhatsApp",
        icon: <FaWhatsapp />,
        color: "bg-green-500",
        hoverColor: "hover:bg-green-600",
        placeholder: "https://wa.me/1234567890",
      },
      {
        id: "telegram",
        name: "Telegram",
        icon: <FaTelegram />,
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
      {
        id: "calendar",
        name: "Calendar",
        icon: <FiCalendar />,
        color: "bg-orange-500",
        hoverColor: "hover:bg-orange-600",
        placeholder: "https://calendar.google.com/calendar/embed",
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
      const requestsForPlatform = myRequests.filter(r => r.platform === platform.id);
      const latestReq = requestsForPlatform.length > 0
        ? requestsForPlatform.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null;
      const status = latestReq?.status; // 'pending' | 'approved' | 'rejected'
      const approvedTemplateName = latestReq?.templateName;

      // Get assigned templates for this platform - filter by tab for WhatsApp
      let assignedTemplatesForPlatform = [];
      if (platform.id === 'whatsapp') {
        if (templateListTab === 'available') {
          assignedTemplatesForPlatform = whatsappTemplates.filter(t => t.status === 'APPROVED');
        } else {
          assignedTemplatesForPlatform = whatsappTemplates.filter(t => t.status === 'REMOVED');
        }
      } else if (platform.id === 'calendar') {
        assignedTemplatesForPlatform = calendarTemplates;
      } else {
        assignedTemplatesForPlatform = assignedTemplates.filter(t => t.platform === platform.id && t.status === 'APPROVED');
      }

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
                <h4 className="font-medium text-gray-800">
                  {platform.name}
                </h4>
                {/* Status indicators */}
                {platform.id === 'whatsapp' && status && (
                  <div className="flex items-center gap-1 mt-1">
                    {status === 'pending' && (
                      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
                        Pending
                      </span>
                    )}
                    {status === 'approved' && (
                      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Approved
                      </span>
                    )}
                    {status === 'rejected' && (
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
                {isEnabled ? 'Enabled' : 'Disabled'}
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
              {/* Add template button for Calendar only */}
              {platform.id === 'calendar' && (
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Calendar Templates
                  </h4>
                  <button
                    type="button"
                    onClick={() => setAddTemplateModal({ open: true, platform: platform.id })}
                    className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
                  >
                    <span className="text-lg">+</span>
                    Add Template
                  </button>
                </div>
              )}

              {/* Show assigned templates if available */}
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <div className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                     Templates ({assignedTemplatesForPlatform.length})
                   </div>
                   
                   {/* WhatsApp tabs for Available/Removed - Always show for WhatsApp */}
                   {platform.id === 'whatsapp' && (
                    
                     <div className="flex gap-2 items-center">
                        <button
                         type="button"
                         onClick={() => setAddTemplateModal({ open: true, platform: 'whatsapp' })}
                         className="px-3 py-2 text-sm font-medium bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 flex items-center gap-2"
                       >
                         <span className="text-lg">+</span>
                         Raise Request
                       </button>
                       <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                         <button
                           type="button"
                           onClick={() => setTemplateListTab('available')}
                           className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                             templateListTab === 'available'
                               ? 'bg-white text-green-700 shadow-sm border border-green-200'
                               : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                           }`}
                         >
                           <span className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-green-500"></span>
                             Available
                             <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                               {whatsappTemplates.filter(t => t.status === 'APPROVED').length}
                             </span>
                           </span>
                         </button>
                         <button
                           type="button"
                           onClick={() => setTemplateListTab('removed')}
                           className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                             templateListTab === 'removed'
                               ? 'bg-white text-red-700 shadow-sm border border-red-200'
                               : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                           }`}
                         >
                           <span className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-red-500"></span>
                             Removed
                             <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                               {whatsappTemplates.filter(t => t.status === 'REMOVED').length}
                             </span>
                           </span>
                         </button>
                       </div>
                     
                     </div>
                   )}
                 </div>
                 
                 {assignedTemplatesForPlatform.length > 0 ? (
                   <>
                     {/* Template Filters */}
                     <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 mb-4">
                       <div className="flex flex-col sm:flex-row gap-3">
                         <div className="flex-1">
                           <label className="block text-sm font-medium text-gray-700 mb-1">Search Templates</label>
                           <input
                             type="text"
                             placeholder="Search by template name..."
                             value={templateFilter}
                             onChange={(e) => setTemplateFilter(e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                           />
                         </div>
                         <div className="flex-1">
                           <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
                           <select
                             value={templateCategoryFilter}
                             onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                           >
                             <option value="">All Categories</option>
                             <option value="MARKETING">Marketing</option>
                             <option value="UTILITY">Utility</option>
                           </select>
                         </div>
                         <div className="flex items-end">
                           <button
                             type="button"
                             onClick={() => {
                               setTemplateFilter('');
                               setTemplateCategoryFilter('');
                             }}
                             className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                           >
                             Clear Filters
                           </button>
                         </div>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-1 gap-2">
                       {assignedTemplatesForPlatform
                         .filter(t => {
                           const matchesSearch = templateFilter === '' || 
                             t.name.toLowerCase().includes(templateFilter.toLowerCase()) ||
                             (t.description && t.description.toLowerCase().includes(templateFilter.toLowerCase()));
                           
                           // More flexible category matching
                           const matchesCategory = templateCategoryFilter === '' || 
                             (t.category && (
                               t.category.toLowerCase() === templateCategoryFilter.toLowerCase() ||
                               t.category.toLowerCase().replace(/[_-]/g, '') === templateCategoryFilter.toLowerCase().replace(/[_-]/g, '') ||
                               t.category.toLowerCase().includes(templateCategoryFilter.toLowerCase()) ||
                               templateCategoryFilter.toLowerCase().includes(t.category.toLowerCase())
                             ));
                           
                           return matchesSearch && matchesCategory;
                         })
                         .map(t => (
                       <div
                         key={t._id}
                         className={`border rounded-xl p-6 bg-gray-50/80 backdrop-blur-sm hover:shadow-md transition-all duration-200 ${
                           defaultTemplate && defaultTemplate.templateId === t._id ? 'ring-2 ring-blue-500 bg-blue-50/90 border-blue-200' : 'border-gray-200'
                         } ${t.status === 'REMOVED' ? 'opacity-75 bg-gray-100/80 border-gray-300' : ''}`}
                       >
                         <div className="flex items-start justify-between gap-3 mb-3">
                           <div className="flex items-center gap-3 flex-1">
                             {t.imageUrl && (
                               <img src={t.imageUrl} alt={t.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                             )}
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-3">
                                 <div className="font-semibold text-gray-900 text-xl truncate">{t.name}</div>
                                 <div className="flex items-center gap-2">
                                   {defaultTemplate && defaultTemplate.templateId === t._id && (
                                     <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                       ✓ Default
                                     </span>
                                   )}
                                   {t.status === 'REMOVED' && (
                                     <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                                       🗑️ Removed
                                     </span>
                                   )}
                                   {/* Approval Date & Time */}
                                   {t.assignedAt && (
                                     <span className="text-xs text-gray-500">
                                       📅 {new Date(t.assignedAt).toLocaleDateString()} {new Date(t.assignedAt).toLocaleTimeString()}
                                     </span>
                                   )}
                                 </div>
                               </div>
                               
                               {/* Show links below heading for calendar and WhatsApp templates */}
                               {platform.id === 'calendar' && t.link && (
                                 <div className="mt-2">
                                   <a 
                                     href={t.link} 
                                     target="_blank" 
                                     rel="noopener noreferrer" 
                                     className="text-sm text-blue-600 hover:underline break-all"
                                   >
                                     📅 {t.link}
                                   </a>
                                 </div>
                               )}
                  
                               
                               <div className="flex items-center gap-2 mt-2">
                                 {t.status && t.status !== 'REMOVED' && (
                                   <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                     t.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                     t.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                                     'bg-gray-100 text-gray-700 border border-gray-200'
                                   }`}>
                                     {t.status === 'APPROVED' ? '✓ Approved' : t.status}
                                   </span>
                                 )}
                                 {t.category && (
                                   <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium border border-purple-200">
                                     📂 {t.category}
                                   </span>
                                 )}
                               </div>
                             </div>
                           </div>
                           <div className="flex items-center gap-4">
                             {/* Default Template Toggle - Center */}
                             {templateListTab === 'available' && (
                               <div className="flex items-center gap-3">
                                 <span className="text-sm font-medium text-gray-700">Default:</span>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                   <input
                                     type="checkbox"
                                     className="sr-only peer"
                                     checked={defaultTemplate && defaultTemplate.templateId === t._id}
                                     onChange={() => {
                                       // For WhatsApp, generate the template module URL instead of using the template's actual URL
                                       let urlToUse = t.url;
                                       if (platform.id === 'whatsapp') {
                                         const base = 'https://whatsapp-template-module.onrender.com/api/whatsapp/send';
                                         const suffix = t.name ? `-${t.name}` : '';
                                         urlToUse = base + suffix;
                                       }
                                       
                                       if (defaultTemplate && defaultTemplate.templateId === t._id) {
                                         // Remove from default
                                         setDefaultTemplate(null);
                                       } else {
                                         // Set as default
                                         setDefaultTemplate({
                                           templateId: t._id,
                                           templateName: t.name,
                                           templateUrl: urlToUse,
                                           platform: platform.id
                                         });
                                       }
                                     }}
                                   />
                                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                 </label>
                               </div>
                             )}
                             
                             {/* Three dots menu */}
                             <div className="relative group">
                               <button
                                 type="button"
                                 className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                 title="More options"
                               >
                                 <FiMoreVertical className="w-4 h-4" />
                               </button>
                               <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                 <div className="py-1">
                                   <button
                                     type="button"
                                     onClick={() => {
                                       if (platform.id === 'calendar') {
                                         // Remove calendar template
                                         setCalendarTemplates(prev => prev.filter(temp => temp._id !== t._id));
                                       } else {
                                         // Remove/restore other templates
                                         handleTemplateStatusChange(t._id, t.status === 'APPROVED' ? 'REMOVED' : 'APPROVED');
                                       }
                                     }}
                                     className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                   >
                                     <FiTrash2 className="w-4 h-4" />
                                     {platform.id === 'calendar' ? 'Delete' : (t.status === 'APPROVED' ? 'Remove' : 'Restore')}
                                   </button>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                         
                         {t.description && (
                           <div 
                             className="text-sm text-gray-600 mb-4 whitespace-pre-wrap line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                             onClick={() => setViewTemplateModal({ open: true, template: t })}
                             title="Click to view full details"
                           >
                             <span className="font-medium text-gray-700">Description:</span> {t.description}
                           </div>
                         )}
                         
                         
                       </div>
                                              ))}
                       </div>
                     </>
                   ) : (
                   <div className="text-center py-12 text-gray-500">
                     <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                       {templateListTab === 'removed' ? (
                         <FiTrash2 className="w-8 h-8 text-gray-400" />
                       ) : (
                         <FiEye className="w-8 h-8 text-gray-400" />
                       )}
                     </div>
                     <h3 className="text-lg font-medium text-gray-700 mb-2">
                       No {templateListTab} templates
                     </h3>
                     <p className="text-sm text-gray-500">
                       {templateListTab === 'removed' 
                         ? 'Templates will appear here after being removed from the available list.'
                         : 'No templates are currently available for this agent.'
                       }
                     </p>
                   </div>
                 )}
               </div>

              {/* Loading state for WhatsApp templates */}
              {platform.id === 'whatsapp' && loadingWhatsappTemplates && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading templates...</p>
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
            Manage templates for your agent
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-1 mb-6 w-full">
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
        <div className="border border-gray-200 rounded-b-lg bg-white" style={{ maxHeight: '600px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="p-6">
            {renderPlatformContent(socialPlatforms.find(p => p.id === selectedSocialTab))}
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

  const handleTemplateStatusChange = async (templateId, newStatus) => {
    try {
      const authToken =
        clientToken ||
        sessionStorage.getItem("clienttoken") ||
        localStorage.getItem("admintoken");
      
      // Convert status to action for backend
      const action = newStatus === 'REMOVED' ? 'remove' : 'restore';
      
      const resp = await fetch(`${API_BASE_URL}/templates/agent/template-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          agentId: agent._id,
          templateId,
          action: action
        }),
      });
      const json = await resp.json();
      console.log('Template status change response:', json);
      if (json.success) {
        alert(`Template ${action === 'remove' ? 'removed' : 'restored'} successfully!`);
        // Refresh WhatsApp templates
        await fetchWhatsappTemplates();
        // Clear default template if it was removed
        if (newStatus === 'REMOVED' && defaultTemplate?.templateId === templateId) {
          setDefaultTemplate(null);
        }
      } else {
        alert(`Failed to ${action} template: ${json.message}`);
      }
    } catch (e) {
      console.error('Error updating template status:', e);
      alert('Failed to update template status');
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
      case "integration":
        return renderIntegrationSettingsTab();
      case "social":
        return renderSocialMediaTab();
      default:
        return renderStartingMessagesTab();
    }
  };

  const isLastTab = selectedTab === tabs[tabs.length - 1].key;
  const isFirstTab = selectedTab === tabs[0].key;

  return (
    <div className="bg-white rounded-lg shadow-lg mx-auto">
      
      <div className="border-b border-gray-200 p-6">
      <h1 className="text-2xl font-bold text-gray-800">AI Agent</h1>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {agent ? `${agent.agentName}` : "Create New Agent"}
          </h2>
          <div className="flex items-center gap-3">
            {agent && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all hover:-translate-y-1"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    
                    Update Agent
                  </div>
                )}
              </button>
            )}
            <button
              type="button"
              title="Help"
              onClick={() => window.open('https://web.whatsapp.com/send/?phone=8147540362&text=I%20need%20help%20with%20agent%20templates', '_blank')}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 hover:shadow-md"
            >
              ?
            </button>
          </div>
        </div>
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
          <div className="flex-1 p-8" style={{ overflowY: 'auto', maxHeight: '80vh', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
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

      {/* Add Template Modal */}
      {addTemplateModal.open && (
        <div className="fixed inset-0 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Add {addTemplateModal.platform === 'calendar' ? 'Calendar' : 'WhatsApp'} Template
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAddTemplateModal({ open: false, platform: '' });
                    setNewTemplateData({ description: '', link: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder={addTemplateModal.platform === 'calendar' 
                      ? "Describe the calendar template..." 
                      : "Describe the WhatsApp template..."
                    }
                    value={newTemplateData.description}
                    onChange={(e) => setNewTemplateData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                      addTemplateModal.platform === 'calendar' 
                        ? 'focus:ring-orange-500' 
                        : 'focus:ring-green-500'
                    }`}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {addTemplateModal.platform === 'calendar' ? 'Calendar Link' : 'Template URL'}
                  </label>
                  <input
                    type="url"
                    placeholder={addTemplateModal.platform === 'calendar' 
                      ? "https://calendar.google.com/calendar/embed..." 
                      : "https://example.com/template..."
                    }
                    value={newTemplateData.link}
                    onChange={(e) => setNewTemplateData(prev => ({ ...prev, link: e.target.value }))}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      addTemplateModal.platform === 'calendar' 
                        ? 'focus:ring-orange-500' 
                        : 'focus:ring-green-500'
                    }`}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAddTemplateModal({ open: false, platform: '' });
                    setNewTemplateData({ description: '', link: '' });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newTemplateData.description.trim() && newTemplateData.link.trim()) {
                      const newTemplate = {
                        _id: Date.now().toString(),
                        name: newTemplateData.description.substring(0, 50) + (newTemplateData.description.length > 50 ? '...' : ''),
                        description: newTemplateData.description,
                        link: newTemplateData.link,
                        platform: addTemplateModal.platform
                      };
                      
                      if (addTemplateModal.platform === 'calendar') {
                        setCalendarTemplates(prev => [...prev, newTemplate]);
                      } else if (addTemplateModal.platform === 'whatsapp') {
                        // Add to WhatsApp templates with APPROVED status
                        const whatsappTemplate = {
                          ...newTemplate,
                          url: newTemplate.link,
                          status: 'APPROVED',
                          category: 'UTILITY',
                          language: 'en'
                        };
                        setWhatsappTemplates(prev => [...prev, whatsappTemplate]);
                      }
                      
                      setAddTemplateModal({ open: false, platform: '' });
                      setNewTemplateData({ description: '', link: '' });
                    } else {
                      alert('Please fill in both description and link');
                    }
                  }}
                  className={`px-4 py-2 text-white rounded transition-colors ${
                    addTemplateModal.platform === 'calendar' 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  Add Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Template Modal */}
      {viewTemplateModal.open && viewTemplateModal.template && (
        <div className="fixed inset-0 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Template Details</h3>
                <button
                  type="button"
                  onClick={() => setViewTemplateModal({ open: false, template: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg text-gray-900">{viewTemplateModal.template.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      viewTemplateModal.template.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                      viewTemplateModal.template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                      viewTemplateModal.template.status === 'REMOVED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {viewTemplateModal.template.status}
                    </span>
                    {viewTemplateModal.template.language && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {viewTemplateModal.template.language}
                      </span>
                    )}
                    {viewTemplateModal.template.category && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        {viewTemplateModal.template.category}
                      </span>
                    )}
                  </div>
                </div>
                
                {viewTemplateModal.template.imageUrl && (
                  <div>
                    <img 
                      src={viewTemplateModal.template.imageUrl} 
                      alt={viewTemplateModal.template.name} 
                      className="w-full max-w-md h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
                
                {viewTemplateModal.template.description && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Description</h5>
                    <p className="text-gray-600 whitespace-pre-wrap">{viewTemplateModal.template.description}</p>
                  </div>
                )}
                
                {viewTemplateModal.template.url && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Template URL</h5>
                    <a 
                      href={viewTemplateModal.template.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {viewTemplateModal.template.url}
                    </a>
                  </div>
                )}
                
                {viewTemplateModal.template.assignedAt && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Approval Date & Time</h5>
                    <p className="text-gray-600">
                      {new Date(viewTemplateModal.template.assignedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setViewTemplateModal({ open: false, template: null })}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentForm;