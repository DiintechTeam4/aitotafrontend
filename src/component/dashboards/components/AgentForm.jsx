"use client";
import { FiMail, FiMessageSquare, FiEye, FiTrash2, FiRotateCcw, FiHelpCircle, FiCalendar, FiMoreVertical, FiCheck, FiX, FiSettings, FiUser, FiMic, FiCode, FiLink, FiSave, FiArrowRight, FiArrowLeft, FiPlus, FiSun, FiMoon } from "react-icons/fi";
import { FaWhatsapp, FaTelegram } from "react-icons/fa";
import { useState, useEffect, createContext, useContext } from "react";
import VoiceSynthesizer from "./VoiceSynthesizer";
import AudioRecorder from "./AudioRecorder";
import { API_BASE_URL } from "../../../config";

// Theme Context
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider Component
const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check if there's a saved theme preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agentform-theme');
      if (saved) return saved === 'dark';
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentform-theme', newTheme ? 'dark' : 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={isDark ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Theme Toggle Component
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative">
        <FiSun className={`w-6 h-6 text-yellow-500 transition-all duration-300 absolute ${isDark ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
        <FiMoon className={`w-6 h-6 text-blue-400 transition-all duration-300 absolute ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
      </div>
    </button>
  );
};

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
    { key: "starting", label: "Starting Messages", icon: <FiMessageSquare />, gradient: "from-blue-500 to-cyan-500" },
    { key: "personal", label: "Personal Information", icon: <FiUser />, gradient: "from-purple-500 to-pink-500" },
    { key: "voice", label: "Voice Configuration", icon: <FiMic />, gradient: "from-green-500 to-emerald-500" },
    { key: "system", label: "System Configuration", icon: <FiCode />, gradient: "from-orange-500 to-red-500" },
    { key: "integration", label: "Telephony Settings", icon: <FiSettings />, gradient: "from-gray-600 to-gray-800" },
    { key: "social", label: "Action", icon: <FiLink />, gradient: "from-indigo-500 to-blue-600" },
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
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
          <FiMessageSquare className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          Starting Messages
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Create engaging opening messages that will greet your users. Choose which one should be the default.
        </p>
      </div>
      
      <div className="space-y-6">
        {startingMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
              defaultStartingMessageIndex === idx 
                ? 'border-blue-400 dark:border-blue-500 shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/30' 
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  defaultStartingMessageIndex === idx 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                }`}>
                  {idx + 1}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultStartingMessage"
                    checked={defaultStartingMessageIndex === idx}
                    onChange={() => setDefaultStartingMessageIndex(idx)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    defaultStartingMessageIndex === idx 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}>
                    {defaultStartingMessageIndex === idx && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${
                    defaultStartingMessageIndex === idx ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {defaultStartingMessageIndex === idx ? 'Default Message' : 'Set as default'}
                  </span>
                </label>
              </div>
              
              {startingMessages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStartingMessage(idx)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                  title="Remove message"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Message Input */}
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={msg.text}
                  onChange={(e) => handleStartingMessageChange(idx, e.target.value)}
                  rows="4"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 resize-none placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={`Enter your starting message ${idx + 1}...`}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
                  {msg.text.length} chars
                </div>
              </div>
              
              {/* Audio Controls */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
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
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <FiCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">Audio ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addStartingMessage}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
        >
          <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            <FiPlus className="w-5 h-5" />
            <span className="font-medium">Add Another Message</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderPersonalInfoTab = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
          <FiUser className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Personal Information
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Define your agent's identity, role, and personality to create the perfect AI assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="group">
            <label htmlFor="agentName" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Agent Name *
            </label>
            <input
              type="text"
              id="agentName"
              name="agentName"
              value={formData.agentName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-400 dark:focus:border-purple-500 transition-all duration-200 text-lg placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter agent name..."
            />
          </div>

          <div className="group">
            <label htmlFor="category" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Expert Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-400 dark:focus:border-purple-500 transition-all duration-200 text-lg"
            >
              <option value="">Select Expert Category</option>
              <option value="customer-service">Customer Service</option>
              <option value="sales">Sales</option>
              <option value="support">Technical Support</option>
              <option value="marketing">Marketing</option>
              <option value="general">General Assistant</option>
            </select>
          </div>

          <div className="group">
            <label htmlFor="personality" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Personality (Behaviour)
            </label>
            <select
              id="personality"
              name="personality"
              value={formData.personality}
              onChange={handleInputChange}
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-400 dark:focus:border-purple-500 transition-all duration-200 text-lg"
            >
              <option value="formal">Formal</option>
              <option value="informal">Informal</option>
              <option value="friendly">Friendly</option>
              <option value="flirty">Flirty</option>
              <option value="disciplined">Disciplined</option>
            </select>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="group">
            <label htmlFor="description" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              required
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-400 dark:focus:border-purple-500 transition-all duration-200 text-lg placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              placeholder="Describe your agent's purpose and capabilities..."
            />
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {formData.description.length}/500 characters
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVoiceConfigTab = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
          <FiMic className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          Voice Configuration
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Configure your agent's voice settings and generate audio for the first message.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="group">
            <label htmlFor="language" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Language
            </label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 focus:border-green-400 dark:focus:border-green-500 transition-all duration-200 text-lg"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div className="group">
            <label htmlFor="voiceSelection" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Voice Selection
            </label>
            <select
              id="voiceSelection"
              name="voiceSelection"
              value={formData.voiceSelection}
              onChange={handleInputChange}
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 focus:border-green-400 dark:focus:border-green-500 transition-all duration-200 text-lg"
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

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border-2 border-green-100 dark:border-green-800">
            <label className="block mb-4 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              First Message Audio
            </label>
            <div className="space-y-4">
              <VoiceSynthesizer
                text={formData.firstMessage}
                language={formData.language}
                speaker={formData.voiceSelection}
                onAudioGenerated={handleAudioGenerated}
                clientId={clientId}
              />
              <div className="text-center">
                <AudioRecorder onAudioRecorded={handleAudioRecorded} />
              </div>
              {formData.audioBase64 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-green-200 dark:border-green-700">
                  <audio
                    controls
                    src={`data:audio/wav;base64,${formData.audioBase64}`}
                    className="w-full"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemConfigTab = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
          <FiCode className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          System Configuration
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Define your agent's behavior and configure telephony settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="group">
            <label htmlFor="callingType" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Calling Type
            </label>
            <select
              id="callingType"
              name="callingType"
              value={formData.callingType}
              onChange={handleInputChange}
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-400 dark:focus:border-orange-500 transition-all duration-200 text-lg"
            >
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="group">
            <label htmlFor="callingNumber" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Calling Number *
            </label>
            <input
              type="text"
              id="callingNumber"
              name="callingNumber"
              value={formData.callingNumber}
              onChange={handleInputChange}
              placeholder="Enter your calling number"
              required
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-400 dark:focus:border-orange-500 transition-all duration-200 text-lg placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="group">
            <label htmlFor="systemPrompt" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
              System Prompt *
            </label>
            <div className="relative">
              <textarea
                id="systemPrompt"
                name="systemPrompt"
                value={formData.systemPrompt}
                onChange={handleInputChange}
                rows="12"
                required
                placeholder="Define the agent's behavior, knowledge, and capabilities..."
                className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-400 dark:focus:border-orange-500 transition-all duration-200 text-lg placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              />
              <div className="absolute bottom-4 right-4 text-sm text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                {formData.systemPrompt.length} chars
              </div>
            </div>
            <div className="mt-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                <strong>Tip:</strong> This prompt defines how the AI agent should behave and respond to users. Be specific about tone, knowledge areas, and response style.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrationSettingsTab = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-lg">
          <FiSettings className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-2">
          Integration Settings
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Configure API keys and external service integrations for your agent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="group">
          <label htmlFor="X_API_KEY" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
            X API Key
          </label>
          <input
            type="password"
            id="X_API_KEY"
            name="X_API_KEY"
            value={formData.X_API_KEY}
            onChange={handleInputChange}
            placeholder="Enter X API Key"
            className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 focus:border-gray-400 dark:focus:border-gray-500 transition-all duration-200 text-lg placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {(!formData.serviceProvider || formData.serviceProvider !== "tata") && (
          <>
            <div className="group">
              <label htmlFor="accountSid" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
                Account SID
              </label>
              <input
                type="text"
                id="accountSid"
                name="accountSid"
                value={formData.accountSid}
                onChange={handleInputChange}
                placeholder="Enter your account SID"
                className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 focus:border-gray-400 dark:focus:border-gray-500 transition-all duration-200 text-lg placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="group">
              <label htmlFor="callerId" className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg">
                Caller ID
              </label>
              <input
                type="text"
                id="callerId"
                name="callerId"
                value={formData.callerId}
                onChange={handleInputChange}
                placeholder="Enter caller ID (phone number)"
                className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 focus:border-gray-400 dark:focus:border-gray-500 transition-all duration-200 text-lg placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </>
        )}
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
        gradient: "from-green-400 to-green-600",
        lightBg: "bg-green-50 dark:bg-green-900/20",
        placeholder: "https://wa.me/1234567890",
      },
      {
        id: "telegram",
        name: "Telegram",
        icon: <FaTelegram />,
        color: "bg-blue-500",
        hoverColor: "hover:bg-blue-600",
        gradient: "from-blue-400 to-blue-600",
        lightBg: "bg-blue-50 dark:bg-blue-900/20",
        placeholder: "https://t.me/username",
      },
      {
        id: "email",
        name: "Email",
        icon: <FiMail />,
        color: "bg-red-500",
        hoverColor: "hover:bg-red-600",
        gradient: "from-red-400 to-red-600",
        lightBg: "bg-red-50 dark:bg-red-900/20",
        placeholder: "mailto:example@email.com",
      },
      {
        id: "sms",
        name: "SMS",
        icon: <FiMessageSquare />,
        color: "bg-purple-500",
        hoverColor: "hover:bg-purple-600",
        gradient: "from-purple-400 to-purple-600",
        lightBg: "bg-purple-50 dark:bg-purple-900/20",
        placeholder: "sms:+1234567890",
      },
      {
        id: "calendar",
        name: "Calendar",
        icon: <FiCalendar />,
        color: "bg-orange-500",
        hoverColor: "hover:bg-orange-600",
        gradient: "from-orange-400 to-orange-600",
        lightBg: "bg-orange-50 dark:bg-orange-900/20",
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
        <div className="space-y-6">
          {/* Enhanced Enable/Disable Toggle */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${platform.lightBg} to-white dark:to-gray-800 p-6 rounded-2xl border-2 transition-all duration-300 ${
            isEnabled ? `border-${platform.id === 'whatsapp' ? 'green' : platform.id === 'telegram' ? 'blue' : platform.id === 'email' ? 'red' : platform.id === 'sms' ? 'purple' : 'orange'}-300 dark:border-${platform.id === 'whatsapp' ? 'green' : platform.id === 'telegram' ? 'blue' : platform.id === 'email' ? 'red' : platform.id === 'sms' ? 'purple' : 'orange'}-600 shadow-lg` : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 bg-gradient-to-r ${platform.gradient} rounded-2xl flex items-center justify-center text-white text-xl shadow-lg transform transition-transform duration-200 ${isEnabled ? 'scale-110' : 'scale-100'}`}>
                  {platform.icon}
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-800 dark:text-gray-200">
                    {platform.name}
                  </h4>
                  {/* Enhanced Status indicators */}
                  {platform.id === 'whatsapp' && status && (
                    <div className="flex items-center gap-2 mt-2">
                      {status === 'pending' && (
                        <span className="inline-flex items-center text-sm px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                          Pending Approval
                        </span>
                      )}
                      {status === 'approved' && (
                        <span className="inline-flex items-center text-sm px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-700">
                          <FiCheck className="w-3 h-3 mr-2" />
                          Approved
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className="inline-flex items-center text-sm px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700">
                          <FiX className="w-3 h-3 mr-2" />
                          Rejected
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isEnabled ? 'Integration active' : 'Integration disabled'}
                  </p>
                </div>
              </div>

              {/* Enhanced Toggle Switch */}
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium transition-colors ${isEnabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                  {isEnabled ? 'ON' : 'OFF'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer group">
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
                  <div className={`w-14 h-8 rounded-full transition-all duration-300 shadow-inner ${
                    isEnabled ? `bg-gradient-to-r ${platform.gradient} shadow-lg` : "bg-gray-300 dark:bg-gray-600"
                  }`}>
                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-all duration-300 shadow-md ${
                      isEnabled ? "translate-x-6" : "translate-x-0"
                    } group-hover:shadow-lg`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Enhanced Content when enabled */}
          {isEnabled && (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
              {/* Add template button for Calendar only */}
              {platform.id === 'calendar' && (
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Calendar Templates
                  </h4>
                  <button
                    type="button"
                    onClick={() => setAddTemplateModal({ open: true, platform: platform.id })}
                    className={`px-6 py-3 text-white rounded-xl transition-all duration-200 flex items-center gap-3 bg-gradient-to-r ${platform.gradient} hover:shadow-lg transform hover:-translate-y-1`}>
                    <FiPlus className="text-lg" />
                    Add Template
                  </button>
                </div>
              )}

              {/* Enhanced Templates Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h5 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                      Templates
                    </h5>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${platform.gradient} text-white shadow-sm`}>
                      {assignedTemplatesForPlatform.length}
                    </span>
                  </div>
                   
                  {/* WhatsApp tabs for Available/Removed */}
                  {platform.id === 'whatsapp' && (
                    <div className="flex gap-3 items-center">
                      <button
                        type="button"
                        onClick={() => setAddTemplateModal({ open: true, platform: 'whatsapp' })}
                        className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5"
                      >
                        <FiPlus className="text-base" />
                        Raise Request
                      </button>
                      
                    </div>
                  )}
                </div>
                 
                {assignedTemplatesForPlatform.length > 0 ? (
                  <>
                    {/* Enhanced Template Filters */}
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Search Templates</label>
                          <input
                            type="text"
                            placeholder="Search by template name..."
                            value={templateFilter}
                            onChange={(e) => setTemplateFilter(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                          <select
                            value={templateCategoryFilter}
                            onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">All Categories</option>
                            <option value="MARKETING">Marketing</option>
                            <option value="UTILITY">Utility</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                        <button
                          type="button"
                          onClick={() => setTemplateListTab('available')}
                          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            templateListTab === 'available'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md transform scale-105'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            Available
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              templateListTab === 'available' ? 'bg-white/20 text-white' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            }`}>
                              {whatsappTemplates.filter(t => t.status === 'APPROVED').length}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateListTab('removed')}
                          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            templateListTab === 'removed'
                              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md transform scale-105'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            Removed
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              templateListTab === 'removed' ? 'bg-white/20 text-white' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                              {whatsappTemplates.filter(t => t.status === 'REMOVED').length}
                            </span>
                          </span>
                        </button>
                      </div>
                    {/* Enhanced Template Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      {assignedTemplatesForPlatform
                        .filter(t => {
                          const matchesSearch = templateFilter === '' || 
                            t.name.toLowerCase().includes(templateFilter.toLowerCase()) ||
                            (t.description && t.description.toLowerCase().includes(templateFilter.toLowerCase()));
                          
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
                          className={`group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                            defaultTemplate && defaultTemplate.templateId === t._id 
                              ? 'border-blue-400 dark:border-blue-500 shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800' 
                              : t.status === 'REMOVED' 
                                ? 'border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50 to-gray-50 dark:from-red-900/20 dark:to-gray-800 opacity-80' 
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          {/* Gradient Overlay */}
                          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${platform.gradient} transition-all duration-300 ${
                            defaultTemplate && defaultTemplate.templateId === t._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}></div>
                          
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4 flex-1">
                              {t.imageUrl && (
                                <img src={t.imageUrl} alt={t.name} className="w-16 h-16 object-cover rounded-xl shadow-md flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h6 className="font-bold text-xl text-gray-900 dark:text-gray-100 truncate">{t.name}</h6>
                                  <div className="flex items-center gap-2">
                                    {defaultTemplate && defaultTemplate.templateId === t._id && (
                                      <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium shadow-sm">
                                        <FiCheck className="w-3 h-3 mr-1" />
                                        Default
                                      </span>
                                    )}
                                    {t.status === 'REMOVED' && (
                                      <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium shadow-sm">
                                        <FiTrash2 className="w-3 h-3 mr-1" />
                                        Removed
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Calendar Links */}
                                {platform.id === 'calendar' && t.link && (
                                  <div className="mb-3">
                                    <a 
                                      href={t.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-700 transition-all duration-200"
                                    >
                                      <FiCalendar className="w-4 h-4" />
                                      Open Calendar
                                    </a>
                                  </div>
                                )}
                  
                                {/* Status and Category Tags */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {t.status && t.status !== 'REMOVED' && (
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium shadow-sm ${
                                      t.status === 'APPROVED' ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white' : 
                                      t.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' : 
                                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                    }`}>
                                      {t.status === 'APPROVED' ? '✓ Approved' : t.status}
                                    </span>
                                  )}
                                  {t.category && (
                                    <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white font-medium shadow-sm">
                                      📂 {t.category}
                                    </span>
                                  )}
                                  {t.assignedAt && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                      📅 {new Date(t.assignedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Enhanced Default Template Toggle */}
                              {templateListTab === 'available' && (
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default:</span>
                                  <label className="relative inline-flex items-center cursor-pointer group">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={defaultTemplate && defaultTemplate.templateId === t._id}
                                      onChange={() => {
                                        let urlToUse = t.url;
                                        if (platform.id === 'whatsapp') {
                                          const base = 'https://whatsapp-template-module.onrender.com/api/whatsapp/send';
                                          const suffix = t.name ? `-${t.name}` : '';
                                          urlToUse = base + suffix;
                                        }
                                        
                                        if (defaultTemplate && defaultTemplate.templateId === t._id) {
                                          setDefaultTemplate(null);
                                        } else {
                                          setDefaultTemplate({
                                            templateId: t._id,
                                            templateName: t.name,
                                            templateUrl: urlToUse,
                                            platform: platform.id
                                          });
                                        }
                                      }}
                                    />
                                    <div className="w-12 h-7 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 shadow-inner"></div>
                                  </label>
                                </div>
                              )}
                              
                              {/* Enhanced Three dots menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group-hover:bg-white dark:group-hover:bg-gray-800"
                                  title="More options"
                                >
                                  <FiMoreVertical className="w-5 h-5" />
                                </button>
                                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-gray-100 dark:border-gray-700 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100">
                                  <div className="py-2">
                                    <button
                                      type="button"
                                      onClick={() => setViewTemplateModal({ open: true, template: t })}
                                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors duration-200"
                                    >
                                      <FiEye className="w-4 h-4" />
                                      View Details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (platform.id === 'calendar') {
                                          setCalendarTemplates(prev => prev.filter(temp => temp._id !== t._id));
                                        } else {
                                          handleTemplateStatusChange(t._id, t.status === 'APPROVED' ? 'REMOVED' : 'APPROVED');
                                        }
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors duration-200"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                      {platform.id === 'calendar' ? 'Delete' : (t.status === 'APPROVED' ? 'Remove' : 'Restore')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Description */}
                          {t.description && (
                            <div 
                              className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-500"
                              onClick={() => setViewTemplateModal({ open: true, template: t })}
                              title="Click to view full details"
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Description:</span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{t.description}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
                    <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-r ${platform.gradient} rounded-full flex items-center justify-center shadow-lg opacity-50`}>
                      {templateListTab === 'removed' ? (
                        <FiTrash2 className="w-10 h-10 text-white" />
                      ) : (
                        <FiEye className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                      No {templateListTab} templates
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                      {templateListTab === 'removed' 
                        ? 'Templates will appear here after being removed from the available list.'
                        : 'No templates are currently available for this agent.'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced Loading state for WhatsApp templates */}
              {platform.id === 'whatsapp' && loadingWhatsappTemplates && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-green-200 dark:border-green-700 border-t-green-500 dark:border-t-green-400 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Loading templates...</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <FiLink className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Action Integration
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Manage templates and integrations for your agent across different platforms.
          </p>
        </div>

        {/* Enhanced Platform Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide bg-gray-50 dark:bg-gray-700">
            {socialPlatforms.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => setSelectedSocialTab(platform.id)}
                className={`flex-shrink-0 py-4 px-6 font-semibold transition-all duration-300 relative ${
                  selectedSocialTab === platform.id
                    ? `bg-gradient-to-r ${platform.gradient} text-white shadow-lg`
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl">{platform.icon}</span>
                  <span className="whitespace-nowrap">{platform.name}</span>
                </div>
                {selectedSocialTab === platform.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
                )}
              </button>
            ))}
          </div>

          {/* Enhanced Tab Content */}
          <div className="p-8" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
        await fetchWhatsappTemplates();
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
  const currentTab = tabs.find(tab => tab.key === selectedTab);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            
            {/* Enhanced Header */}
            <div className="relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r ${currentTab?.gradient || 'from-gray-600 to-gray-800'} opacity-10`}></div>
              <div className="relative px-8 py-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${currentTab?.gradient || 'from-gray-600 to-gray-800'} rounded-2xl flex items-center justify-center shadow-lg`}>
                      {currentTab?.icon || <FiSettings className="w-8 h-8 text-white" />}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Agent</h1>
                      <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        {agent ? `Editing: ${agent.agentName}` : "Create New Agent"}
                      </h2>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {agent && (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-gray-800 to-black dark:from-gray-700 dark:to-gray-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-1"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Updating...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <FiSave className="w-5 h-5" />
                            Update Agent
                          </div>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      title="Need help? Chat with us!"
                      onClick={() => window.open('https://web.whatsapp.com/send/?phone=8147540362&text=I%20need%20help%20with%20agent%20templates', '_blank')}
                      className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 hover:scale-105"
                    >
                      <FiHelpCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Indicator */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {tabs.findIndex(tab => tab.key === selectedTab) + 1} / {tabs.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 shadow-inner">
                    <div 
                      className={`h-2 bg-gradient-to-r ${currentTab?.gradient || 'from-gray-600 to-gray-800'} rounded-full transition-all duration-500 shadow-sm`}
                      style={{ width: `${((tabs.findIndex(tab => tab.key === selectedTab) + 1) / tabs.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <form>
              <div className="flex min-h-[600px]">
                {/* Enhanced Tab Navigation */}
                <div className="w-80 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-r-2 border-gray-200 dark:border-gray-700">
                  <div className="p-6">
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Configuration Steps</h4>
                    <div className="space-y-2">
                      {tabs.map((tab, index) => (
                        <button
                          key={tab.key}
                          type="button"
                          className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                            selectedTab === tab.key
                              ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md"
                          }`}
                          onClick={() => setSelectedTab(tab.key)}
                        >
                          <div className="flex items-center gap-4 p-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              selectedTab === tab.key 
                                ? 'bg-white/20 text-white' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                            }`}>
                              {tab.icon}
                            </div>
                            <div className="text-left flex-1">
                              <div className={`font-semibold text-sm ${selectedTab === tab.key ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                {tab.label}
                              </div>
                              <div className={`text-xs ${selectedTab === tab.key ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                Step {index + 1}
                              </div>
                            </div>
                            {selectedTab === tab.key && (
                              <div className="w-1 h-8 bg-white/30 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Enhanced Tab Content */}
                <div className="flex-1 p-8" style={{ overflowY: 'auto', maxHeight: '80vh' }}>
                  <div className="max-w-5xl mx-auto">
                    {renderTabContent()}
                  </div>
                </div>
              </div>

              {/* Enhanced Form Actions */}
              <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-8">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      Cancel
                    </button>
                    {!isFirstTab && (
                      <button
                        type="button"
                        onClick={handlePrevious}
                        className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
                      >
                        <FiArrowLeft className="w-5 h-5" />
                        Previous
                      </button>
                    )}
                  </div>

                  <div className="flex gap-4">
                    {!isLastTab ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className={`px-8 py-3 bg-gradient-to-r ${currentTab?.gradient || 'from-indigo-500 to-blue-600'} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-3`}
                      >
                        Next Step
                        <FiArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-8 py-3 bg-gradient-to-r from-gray-800 to-black dark:from-gray-700 dark:to-gray-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-3"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FiSave className="w-5 h-5" />
                            {agent ? "Update Agent" : "Create Agent"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Enhanced Add Template Modal */}
            {addTemplateModal.open && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300">
                  <div className={`p-6 bg-gradient-to-r ${
                    addTemplateModal.platform === 'calendar' ? 'from-orange-500 to-red-500' : 'from-green-500 to-emerald-500'
                  } text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          {addTemplateModal.platform === 'calendar' ? <FiCalendar className="w-6 h-6" /> : <FaWhatsapp className="w-6 h-6" />}
                        </div>
                        <h3 className="text-xl font-bold">
                          Add {addTemplateModal.platform === 'calendar' ? 'Calendar' : 'WhatsApp'} Template
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAddTemplateModal({ open: false, platform: '' });
                          setNewTemplateData({ description: '', link: '' });
                        }}
                        className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                      >
                        <FiX className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Description</label>
                        <textarea
                          placeholder={addTemplateModal.platform === 'calendar' 
                            ? "Describe the calendar template..." 
                            : "Describe the WhatsApp template..."
                          }
                          value={newTemplateData.description}
                          onChange={(e) => setNewTemplateData(prev => ({ ...prev, description: e.target.value }))}
                          className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:border-transparent resize-none transition-all duration-200 ${
                            addTemplateModal.platform === 'calendar' 
                              ? 'focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-400 dark:focus:border-orange-500' 
                              : 'focus:ring-green-100 dark:focus:ring-green-900/30 focus:border-green-400 dark:focus:border-green-500'
                          }`}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
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
                          className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-4 focus:border-transparent transition-all duration-200 ${
                            addTemplateplatform === 'calendar' 
                            ? 'focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-400 dark:focus:border-orange-500' 
                            : 'focus:ring-green-100 dark:focus:ring-green-900/30 focus:border-green-400 dark:focus:border-green-500'
                          }`}
                        />
                        
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setAddTemplateModal({ open: false, platform: '' });
                          setNewTemplateData({ description: '', link: '' });
                        }}
                        className="px-5 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200"
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
                        className={`px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-200 transform hover:-translate-y-0.5 ${
                          addTemplateModal.platform === 'calendar' 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg'
                        }`}
                      >
                        Add Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced View Template Modal */}
            {viewTemplateModal.open && viewTemplateModal.template && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto transform animate-in slide-in-from-bottom-4 duration-300">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Template Details</h3>
                        <button
                          type="button"
                          onClick={() => setViewTemplateModal({ open: false, template: null })}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <FiX className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Header Section */}
                      <div className="flex items-start gap-4">
                        {viewTemplateModal.template.imageUrl && (
                          <img 
                            src={viewTemplateModal.template.imageUrl} 
                            alt={viewTemplateModal.template.name} 
                            className="w-20 h-20 object-cover rounded-xl shadow-md flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {viewTemplateModal.template.name}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {viewTemplateModal.template.status && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                viewTemplateModal.template.status === 'APPROVED' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                                  : viewTemplateModal.template.status === 'PENDING'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                              }`}>
                                {viewTemplateModal.template.status}
                              </span>
                            )}
                            {viewTemplateModal.template.language && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-700">
                                🌐 {viewTemplateModal.template.language}
                              </span>
                            )}
                            {viewTemplateModal.template.category && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium border border-purple-200 dark:border-purple-700">
                                📂 {viewTemplateModal.template.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description Section */}
                      {viewTemplateModal.template.description && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-lg">Description</h5>
                          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                            {viewTemplateModal.template.description}
                          </p>
                        </div>
                      )}

                      {/* URL Section */}
                      {viewTemplateModal.template.url && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-700">
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-lg">Template URL</h5>
                          <a 
                            href={viewTemplateModal.template.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline break-all font-mono text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-100 dark:border-blue-700 block"
                          >
                            {viewTemplateModal.template.url}
                          </a>
                        </div>
                      )}

                      {/* Metadata Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewTemplateModal.template.assignedAt && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                            <h6 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm uppercase tracking-wide">Approval Date</h6>
                            <p className="text-gray-600 dark:text-gray-400">
                              {new Date(viewTemplateModal.template.assignedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(viewTemplateModal.template.assignedAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                        
                        {viewTemplateModal.template.platform && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                            <h6 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm uppercase tracking-wide">Platform</h6>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {viewTemplateModal.template.platform === 'whatsapp' && <FaWhatsapp className="text-green-500" />}
                                {viewTemplateModal.template.platform === 'calendar' && <FiCalendar className="text-orange-500" />}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 capitalize">
                                {viewTemplateModal.template.platform}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
                    <button
                      type="button"
                      onClick={() => setViewTemplateModal({ open: false, template: null })}
                      className="w-full py-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AgentForm;