"use client"

import { useState } from "react"

const VoiceSynthesizer = ({ text, language = "en", speaker, onAudioGenerated, clientId }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState("")
  const [error, setError] = useState("")

  const generateAudio = async () => {
    if (!text || !text.trim()) {
      setError("Text is required for audio generation")
      return
    }

    setIsGenerating(true)
    setError("")

    try {
      const response = await fetch(`http://localhost:4000/api/v1/client/voice/synthesize?clientId=${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language, speaker }),
      })
      const data = await response.json()
      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || "Failed to generate audio")
      }
      // Convert base64 to Blob for playback
      const audioBlob = b64toBlob(data.audioBase64, "audio/mpeg")
      const audioUrl = URL.createObjectURL(audioBlob)
      setAudioUrl(audioUrl)
      if (onAudioGenerated) {
        onAudioGenerated(audioBlob, audioUrl, data.audioBase64)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper: base64 to Blob
  function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data)
    const byteArrays = []
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize)
      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }
    return new Blob(byteArrays, { type: contentType })
  }

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl("")
    setError("")
    if (onAudioGenerated) {
      onAudioGenerated(null, null, null)
    }
  }

  return (
    <div className="voice-synthesizer">
      <div className="synthesizer-controls">
        <button type="button" onClick={generateAudio} disabled={isGenerating || !text?.trim()} className="btn-generate">
          {isGenerating ? "🔄 Generating..." : "🔊 Generate Audio"}
        </button>

        {audioUrl && (
          <button type="button" onClick={clearAudio} className="btn-clear">
            🗑️ Clear
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="generating-indicator">
          <div className="spinner"></div>
          <span>Generating audio using Sarvam AI...</span>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="audio-preview">
          <div className="audio-info">
            <span className="success-icon">✅</span>
            Audio generated successfully
          </div>
          <audio controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  )
}

export default VoiceSynthesizer
