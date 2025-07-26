"use client"

import { useState, useEffect } from "react"
import VoiceSynthesizer from "./VoiceSynthesizer"

const AgentForm = ({ agent, onSave, onCancel, clientId }) => {
  const [formData, setFormData] = useState({
    // Personal Information
    agentName: "",
    description: "",
    category: "",
    personality: "formal",
    language: "en",

    // System Information
    firstMessage: "",
    systemPrompt: "",
    sttSelection: "deepgram",
    ttsSelection: "sarvam",
    llmSelection: "openai",
    voiceSelection: "default",
    contextMemory: "",
    brandInfo: "",

    // Telephony
    accountSid: "",
    serviceProvider: "",
    taskDidNumber: "",
  })

  const [audioFile, setAudioFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)

  // Multiple starting messages state
  const [startingMessages, setStartingMessages] = useState([
    { text: "", audioBase64: "" }
  ])
  const [defaultStartingMessageIndex, setDefaultStartingMessageIndex] = useState(0)

  useEffect(() => {
    if (agent) {
      setFormData(agent)
      if (agent.startingMessages && agent.startingMessages.length > 0) {
        setStartingMessages(agent.startingMessages)
        const defaultIdx = agent.startingMessages.findIndex(
          m => m.text === agent.firstMessage
        )
        setDefaultStartingMessageIndex(defaultIdx >= 0 ? defaultIdx : 0)
      } else {
        setStartingMessages([{ text: agent.firstMessage || "", audioBase64: agent.audioBytes || "" }])
        setDefaultStartingMessageIndex(0)
      }
      // Fetch stored audio if editing
      if (agent._id) {
        fetchAudio(agent._id)
      }
    }
  }, [agent])

  const fetchAudio = async (agentId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/client/agents/${agentId}/audio?clientId=${clientId}`)
      if (response.ok) {
        const audioBlob = await response.blob()
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
      } else {
        setAudioUrl(null)
      }
    } catch (error) {
      setAudioUrl(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAudioRecorded = (audioBlob) => {
    setAudioFile(audioBlob)
  }

  const handleAudioGenerated = async (audioBlob, audioUrl) => {
    setAudioFile(audioBlob)
    // Audio will be automatically generated on form submit
  }

  // Handlers for starting messages
  const handleStartingMessageChange = (idx, value) => {
    setStartingMessages(msgs => msgs.map((m, i) => i === idx ? { ...m, text: value } : m))
  }
  const handleAudioGeneratedForMessage = (idx, audioBlob, audioUrl, audioBase64) => {
    setStartingMessages(msgs => msgs.map((m, i) => i === idx ? { ...m, audioBase64 } : m))
  }
  const addStartingMessage = () => {
    setStartingMessages(msgs => [...msgs, { text: "", audioBase64: "" }])
  }
  const removeStartingMessage = (idx) => {
    if (startingMessages.length > 1) {
      setStartingMessages(msgs => msgs.filter((_, i) => i !== idx))
      if (defaultStartingMessageIndex === idx) setDefaultStartingMessageIndex(0)
      else if (defaultStartingMessageIndex > idx) setDefaultStartingMessageIndex(i => i - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const agentPayload = {
        ...formData,
        startingMessages,
        defaultStartingMessageIndex,
      }
      const url = agent
        ? `http://localhost:4000/api/v1/client/agents/${agent._id}?clientId=${clientId}`
        : `http://localhost:4000/api/v1/client/agents?clientId=${clientId}`
      const method = agent ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentPayload),
      })
      if (response.ok) {
        onSave()
      } else {
        throw new Error("Failed to save agent")
      }
    } catch (error) {
      console.error("Error saving agent:", error)
      alert("Error saving agent. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="agent-form">
      <h2>{agent ? "Edit Agent" : "Create New Agent"}</h2>
      <form onSubmit={handleSubmit}>
        {/* Multiple Starting Messages Section */}
        <div className="form-section">
          <h3>Starting Messages</h3>
          {startingMessages.map((msg, idx) => (
            <div key={idx} className="form-group" style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
              <label>Message {idx + 1}</label>
              <textarea
                value={msg.text}
                onChange={e => handleStartingMessageChange(idx, e.target.value)}
                rows="2"
                required
              />
              <div style={{ margin: '8px 0' }}>
                <VoiceSynthesizer
                  text={msg.text}
                  language={formData.language || "en"}
                  speaker={formData.voiceSelection === "anushka" ? "anushka" : "abhilash"}
                  onAudioGenerated={(audioBlob, audioUrl, audioBase64) => handleAudioGeneratedForMessage(idx, audioBlob, audioUrl, audioBase64)}
                  clientId={clientId}
                />
                {msg.audioBase64 && <span style={{ color: 'green', marginLeft: 8 }}>Audio ready</span>}
              </div>
              <div>
                <label>
                  <input
                    type="radio"
                    name="defaultStartingMessage"
                    checked={defaultStartingMessageIndex === idx}
                    onChange={() => setDefaultStartingMessageIndex(idx)}
                  />{' '}
                  Set as default
                </label>
                {startingMessages.length > 1 && (
                  <button type="button" onClick={() => removeStartingMessage(idx)} style={{ marginLeft: 12 }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addStartingMessage} style={{ marginTop: 8 }}>
            + Add Another Message
          </button>
        </div>
        {/* Personal Information Section */}
        <div className="form-section">
          <h3>Personal Information</h3>

          <div className="form-group">
            <label htmlFor="agentName">Agent Name *</label>
            <input
              type="text"
              id="agentName"
              name="agentName"
              value={formData.agentName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={formData.category} onChange={handleInputChange}>
              <option value="">Select Category</option>
              <option value="customer-service">Customer Service</option>
              <option value="sales">Sales</option>
              <option value="support">Technical Support</option>
              <option value="marketing">Marketing</option>
              <option value="general">General Assistant</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="personality">Personality (Behaviour)</label>
            <select id="personality" name="personality" value={formData.personality} onChange={handleInputChange}>
              <option value="formal">Formal</option>
              <option value="informal">Informal</option>
              <option value="friendly">Friendly</option>
              <option value="flirty">Flirty</option>
              <option value="disciplined">Disciplined</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select id="language" name="language" value={formData.language || "en"} onChange={handleInputChange}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>

        {/* System Information Section */}
        <div className="form-section">
          <h3>System Information</h3>

          <div className="form-group">
            <label htmlFor="systemPrompt">System Prompt *</label>
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              value={formData.systemPrompt}
              onChange={handleInputChange}
              rows="5"
              placeholder="Enter the system prompt that defines the agent's behavior"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sttSelection">STT Selection</label>
              <select id="sttSelection" name="sttSelection" value={formData.sttSelection} onChange={handleInputChange}>
                <option value="deepgram">Deepgram</option>
                <option value="whisper">OpenAI Whisper</option>
                <option value="google">Google Speech-to-Text</option>
                <option value="azure">Azure Speech</option>
                <option value="aws">AWS Transcribe</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ttsSelection">TTS Selection</label>
              <select id="ttsSelection" name="ttsSelection" value={formData.ttsSelection} onChange={handleInputChange}>
                <option value="sarvam">Sarvam AI</option>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="openai">OpenAI TTS</option>
                <option value="google">Google Text-to-Speech</option>
                <option value="azure">Azure Speech</option>
                <option value="aws">AWS Polly</option>
                <option value="lmnt">LMNT</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="llmSelection">LLM Selection</label>
              <select id="llmSelection" name="llmSelection" value={formData.llmSelection} onChange={handleInputChange}>
                <option value="openai">OpenAI GPT</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="google">Google Gemini</option>
                <option value="azure">Azure OpenAI</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="voiceSelection">Voice Selection</label>
              <select
                id="voiceSelection"
                name="voiceSelection"
                value={formData.voiceSelection}
                onChange={handleInputChange}
              >
                <option value="default">Default</option>
                <option value="abhilash">Abhilash (Male - English)</option>
                <option value="anushka">Anushka (Female - Hindi)</option>
                <option value="male-professional">Male Professional</option>
                <option value="female-professional">Female Professional</option>
                <option value="male-friendly">Male Friendly</option>
                <option value="female-friendly">Female Friendly</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="contextMemory">Context Memory</label>
            <textarea
              id="contextMemory"
              name="contextMemory"
              value={formData.contextMemory}
              onChange={handleInputChange}
              rows="3"
              placeholder="Additional context information for the agent"
            />
          </div>

          <div className="form-group">
            <label htmlFor="brandInfo">Brand Information</label>
            <textarea
              id="brandInfo"
              name="brandInfo"
              value={formData.brandInfo}
              onChange={handleInputChange}
              rows="3"
              placeholder="Information about your brand/company"
            />
          </div>
        </div>

        {/* Telephony Section */}
        <div className="form-section">
          <h3>Telephony</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="accountSid">Account Sid</label>
              <input
                type="text"
                id="accountSid"
                name="accountSid"
                value={formData.accountSid}
                onChange={handleInputChange}
                placeholder="+1234567890"
              />
            </div>

            <div className="form-group">
              <label htmlFor="serviceProvider">Service Provider</label>
              <select
                id="serviceProvider"
                name="serviceProvider"
                value={formData.serviceProvider}
                onChange={handleInputChange}
              >
                <option value="">Select Provider</option>
                <option value="twilio">Twilio</option>
                <option value="vonage">Vonage</option>
                <option value="plivo">Plivo</option>
                <option value="bandwidth">Bandwidth</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="taskDidNumber">Task DID Number</label>
            <input
              type="text"
              id="taskDidNumber"
              name="taskDidNumber"
              value={formData.taskDidNumber}
              onChange={handleInputChange}
              placeholder="Enter Task DID Number"
            />
          </div>
        </div>

        {agent && agent._id && audioUrl && (
          <div className="audio-preview">
            <label>Stored First Message Audio:</label>
            <audio controls src={audioUrl} />
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? "Saving..." : agent ? "Update Agent" : "Create Agent"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AgentForm
