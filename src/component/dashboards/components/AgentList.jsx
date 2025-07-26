"use client"

import { useState } from "react"

const AgentList = ({ agents, onEdit, onDelete, clientId }) => {
  const [audioUrl, setAudioUrl] = useState(null)
  const [playingAgentId, setPlayingAgentId] = useState(null)

  const formatPersonality = (personality) => {
    return personality.charAt(0).toUpperCase() + personality.slice(1)
  }

  const playAudio = async (agentId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/client/agents/${agentId}/audio?clientId=${clientId}`)
      if (response.ok) {
        const audioBlob = await response.blob()
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setPlayingAgentId(agentId)
      } else {
        setAudioUrl(null)
        setPlayingAgentId(null)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      setAudioUrl(null)
      setPlayingAgentId(null)
    }
  }

  const stopAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setPlayingAgentId(null)
  }

  return (
    <div className="agent-list">
      <h2>AI Agents ({agents.length})</h2>

      {agents.length === 0 ? (
        <div className="empty-state">
          <p>No agents created yet. Create your first AI agent!</p>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map((agent) => (
            <div key={agent._id} className="agent-card">
              <div className="agent-header">
                <h3>{agent.agentName}</h3>
                <div className="agent-actions">
                  <button onClick={() => onEdit(agent)} className="btn-edit" title="Edit Agent">
                    ✏️
                  </button>
                  <button onClick={() => onDelete(agent._id)} className="btn-delete" title="Delete Agent">
                    🗑️
                  </button>
                </div>
              </div>

              <div className="agent-info">
                <p className="description">{agent.description}</p>

                <div className="agent-details">
                  <div className="detail-item">
                    <strong>Category:</strong> {agent.category || "Not specified"}
                  </div>
                  <div className="detail-item">
                    <strong>Personality:</strong> {formatPersonality(agent.personality)}
                  </div>
                  <div className="detail-item">
                    <strong>STT:</strong> {agent.sttSelection}
                  </div>
                  <div className="detail-item">
                    <strong>TTS:</strong> {agent.ttsSelection}
                  </div>
                  <div className="detail-item">
                    <strong>Voice:</strong> {agent.voiceSelection}
                  </div>
                  {agent.accountSid && (
                    <div className="detail-item">
                      <strong>Account Sid:</strong> {agent.accountSid}
                    </div>
                  )}
                  {agent.serviceProvider && (
                    <div className="detail-item">
                      <strong>Provider:</strong> {agent.serviceProvider}
                    </div>
                  )}
                </div>

                <div className="first-message">
                  <strong>First Message:</strong>
                  <p>{agent.firstMessage}</p>
                  <button onClick={() => playAudio(agent._id)} className="btn-play-audio">
                    🔊 Play Audio
                  </button>
                  {playingAgentId === agent._id && audioUrl && (
                    <div className="audio-preview">
                      <audio controls autoPlay src={audioUrl} onEnded={stopAudio} />
                      <button onClick={stopAudio} className="btn-clear">🛑 Stop</button>
                    </div>
                  )}
                </div>

                <div className="system-prompt">
                  <strong>System Prompt:</strong>
                  <p className="truncated">{agent.systemPrompt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AgentList
