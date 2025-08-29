"use client";
import { FiMail, FiMessageSquare } from "react-icons/fi";
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

  const tabs = [
    { key: "starting", label: "Starting Messages" },
    { key: "personal", label: "Personal Information" },
    { key: "voice", label: "Voice Configuration" },
    { key: "system", label: "System Configuration" },
    { key: "integration", label: "Telephony Settings" },
    { key: "social", label: "Tools" },
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
    if (agent.whatsappEnabled) {
      const wa = agent.whatsapplink || (Array.isArray(agent.whatsapp) && agent.whatsapp[0]?.link) || "";
      if (wa) hydrated.push({ platform: "whatsapp", url: wa });
    }
    if (agent.telegramEnabled && Array.isArray(agent.telegram) && agent.telegram[0]?.link) {
      hydrated.push({ platform: "telegram", url: agent.telegram[0].link });
    }
    if (agent.emailEnabled && Array.isArray(agent.email) && agent.email[0]?.link) {
      hydrated.push({ platform: "email", url: agent.email[0].link });
    }
    if (agent.smsEnabled && Array.isArray(agent.sms) && agent.sms[0]?.link) {
      hydrated.push({ platform: "sms", url: agent.sms[0].link });
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
        const linkMap = Object.fromEntries(
          socialMediaLinks
            .filter((l) => l && l.platform && typeof l.url === "string")
            .map((l) => [l.platform, l.url.trim()])
        );
        platforms.forEach((p) => {
          const url = linkMap[p];
          const enabled = !!url;
          socials[`${p}Enabled`] = enabled;
          if (enabled) {
            socials[p] = [{ link: url }];
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
        ...deriveSocials(),
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
          rows="4"
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

    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Tools
          </h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialPlatforms.map((platform) => {
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

              return (
                <div
                  key={platform.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  {/* Platform Header with Toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 ${platform.color} rounded-full flex items-center justify-center text-white text-lg shadow-sm`}
                      >
                        {platform.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {platform.name}
                        </h4>
                        <p className="text-xs text-gray-500">Social platform</p>
                        {platform.id === 'whatsapp' && status && (
                          <div className="mt-1">
                            {status === 'pending' && (
                              <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Request Pending</span>
                            )}
                            {status === 'approved' && (
                              <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-green-100 text-green-700">
                                Approved{approvedTemplateName ? ` • ${approvedTemplateName}` : ''}
                              </span>
                            )}
                            {status === 'rejected' && (
                              <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700">Rejected</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Toggle Switch */}
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
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                            isEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </label>
                  </div>

                  {/* Templates or Contact Admin fallback */}
                  {isEnabled && (
                    <div className="space-y-3">
                      {(() => {
                        const items = assignedTemplates.filter(t => t.platform === platform.id);
                        if (!items || items.length === 0) {
                          return (
                            <div className="p-3 rounded border border-dashed border-gray-300 bg-white">
                              {platform.id === 'whatsapp' && agent?.whatsapplink && status === 'approved' ? (
                                <div>
                                  <div className="text-sm text-gray-800 mb-1">Approved Template{approvedTemplateName ? `: ${approvedTemplateName}` : ''}</div>
                                  <div className="text-xs break-all text-gray-600 mb-2">{agent.whatsapplink}</div>
                                  <button
                                    type="button"
                                    className="px-3 py-1 text-white text-xs rounded bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      const next = socialMediaLinks.map((l) => l.platform === 'whatsapp' ? { ...l, url: agent.whatsapplink } : l);
                                      if (!next.find(l => l.platform === 'whatsapp')) next.push({ platform: 'whatsapp', url: agent.whatsapplink });
                                      setSocialMediaLinks(next);
                                    }}
                                  >
                                    Use this link
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="text-sm text-gray-700 mb-2">No templates available for this platform. Please contact admin.</div>
                                  <a
                                    href="https://web.whatsapp.com/send/?phone=8147540362&text=I%20want%20to%20enable%20my%20business%20with%20Aitota.%20My%20name%20is"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-block px-4 py-2 text-white text-sm rounded ${platform.color} ${platform.hoverColor}`}
                                  >
                                    Contact Admin on WhatsApp
                                  </a>
                                  {platform.id === 'whatsapp' && (
                                    <div className="mt-3">
                                      <button
                                        type="button"
                                        disabled={requesting || !agent?._id || status === 'pending'}
                                        onClick={async () => {
                                          try {
                                            setRequesting(true);
                                            const authToken =
                                              clientToken ||
                                              sessionStorage.getItem("clienttoken") ||
                                              localStorage.getItem("admintoken");
                                            const resp = await fetch(`${API_BASE_URL}/agent-access/request`, {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                Authorization: `Bearer ${authToken}`,
                                              },
                                              body: JSON.stringify({
                                                clientId: clientId || agent?.clientId || '',
                                                agentId: agent?._id,
                                                platform: 'whatsapp'
                                              })
                                            });
                                            const json = await resp.json();
                                            if (json.success) {
                                              alert('Request submitted! Admin will review and approve.');
                                              // refresh requests
                                              try {
                                                const r = await fetch(`${API_BASE_URL}/agent-access/requests?agentId=${agent._id}`);
                                                const rj = await r.json();
                                                setMyRequests(rj?.success ? (rj.data || []) : []);
                                              } catch {}
                                            } else {
                                              alert(json.message || 'Failed to submit request');
                                            }
                                          } catch (e) {
                                            alert('Failed to submit request');
                                          } finally {
                                            setRequesting(false);
                                          }
                                        }}
                                        className={`px-4 py-2 bg-black text-white rounded disabled:bg-gray-400`}
                                      >
                                        {status === 'pending' ? 'Requested' : requesting ? 'Requesting...' : 'Request'}
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Choose Template</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                              {items.map(t => (
                                <button
                                  key={t._id}
                                  type="button"
                                  onClick={() => {
                            const newLinks = socialMediaLinks.map((link) =>
                              link.platform === platform.id
                                        ? { ...link, url: t.url }
                                : link
                            );
                                    // if not present yet, add entry
                                    if (!newLinks.find(l => l.platform === platform.id)) {
                                      newLinks.push({ platform: platform.id, url: t.url });
                                    }
                            setSocialMediaLinks(newLinks);
                          }}
                                  className="border rounded-lg bg-white p-3 text-left hover:shadow"
                                >
                                  <div className="flex items-center gap-3">
                                    {t.imageUrl && (<img src={t.imageUrl} alt={t.name} className="w-12 h-12 object-cover rounded" />)}
                                    <div>
                                      <div className="font-semibold text-sm">{t.name}</div>
                                      <div className="text-xs text-gray-500 break-all">{t.url}</div>
                                    </div>
                                  </div>
                                  {t.description && (<div className="text-xs text-gray-600 mt-1 line-clamp-2">{t.description}</div>)}
                        </button>
                              ))}
                      </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
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
          <div className="flex-1 p-8">
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
    </div>
  );
};

export default AgentForm;
