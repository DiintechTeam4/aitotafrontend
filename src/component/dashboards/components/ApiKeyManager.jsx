"use client"

import { useState, useEffect } from "react"

const ApiKeyManager = ({ clientId }) => {
  const [apiKeys, setApiKeys] = useState([])
  const [providers, setProviders] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [editingProvider, setEditingProvider] = useState(null)
  const [formData, setFormData] = useState({
    key: "",
    keyName: "",
    description: "",
    configuration: {},
  })
  const [testResults, setTestResults] = useState({})

  useEffect(() => {
    fetchApiKeys()
    fetchProviders()
  }, [clientId])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/client/api-keys?clientId=${clientId}`)
      const data = await response.json()

      if (data.success) {
        setApiKeys(data.data)
      }
    } catch (error) {
      console.error("Error fetching API keys:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/v1/client/providers")
      const data = await response.json()

      if (data.success) {
        setProviders(data.data)
      }
    } catch (error) {
      console.error("Error fetching providers:", error)
    }
  }

  const handleEdit = (provider) => {
    const existingKey = apiKeys.find((key) => key.provider === provider)
    setEditingProvider(provider)
    setFormData({
      key: "",
      keyName: existingKey?.keyName || providers[provider]?.name || "",
      description: existingKey?.metadata?.description || "",
      configuration: existingKey?.configuration || {},
    })
  }

  const handleSave = async () => {
    if (!formData.key.trim()) {
      alert("API key is required")
      return
    }

    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/client/api-keys/${editingProvider}?clientId=${clientId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      )

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        setEditingProvider(null)
        setFormData({ key: "", keyName: "", description: "", configuration: {} })
        fetchApiKeys()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error saving API key:", error)
      alert("Failed to save API key")
    }
  }

  const handleTest = async (provider, key) => {
    if (!key.trim()) {
      alert("Please enter an API key to test")
      return
    }

    setTestResults((prev) => ({ ...prev, [provider]: { testing: true } }))

    try {
      const response = await fetch(`http://localhost:4000/api/v1/client/api-keys/${provider}/test?clientId=${clientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, configuration: formData.configuration }),
      })

      const result = await response.json()
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          success: result.success,
          message: result.message || result.error,
        },
      }))
    } catch (error) {
      console.error("Error testing API key:", error)
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          success: false,
          message: "Test failed: " + error.message,
        },
      }))
    }
  }

  const handleDelete = async (provider) => {
    if (!window.confirm(`Are you sure you want to delete the ${providers[provider]?.name} API key?`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:4000/api/v1/client/api-keys/${provider}?clientId=${clientId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        fetchApiKeys()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error deleting API key:", error)
      alert("Failed to delete API key")
    }
  }

  const getProviderStatus = (provider) => {
    const apiKey = apiKeys.find((key) => key.provider === provider)
    return apiKey ? "configured" : "not-configured"
  }

  const getProviderIcon = (provider) => {
    const icons = {
      openai: "🤖",
      deepgram: "🎙️",
      sarvam: "🔊",
      elevenlabs: "🎵",
      google_cloud: "🌐",
      azure_speech: "☁️",
      twilio: "📞",
      vonage: "📱",
    }
    return icons[provider] || "🔑"
  }

  if (isLoading) {
    return (
      <div className="api-key-manager loading">
        <div className="spinner"></div>
        <p>Loading API keys...</p>
      </div>
    )
  }

  return (
    <div className="api-key-manager">
      <div className="manager-header">
        <h2>API Key Management</h2>
        <p>Configure your API keys for different services. Keys are encrypted and stored securely.</p>
      </div>

      <div className="providers-grid">
        {Object.entries(providers).map(([provider, config]) => {
          const status = getProviderStatus(provider)
          const apiKey = apiKeys.find((key) => key.provider === provider)
          const testResult = testResults[provider]

          return (
            <div key={provider} className={`provider-card ${status}`}>
              <div className="provider-header">
                <div className="provider-info">
                  <span className="provider-icon">{getProviderIcon(provider)}</span>
                  <div>
                    <h3>{config.name}</h3>
                    <p>{config.description}</p>
                  </div>
                </div>
                <div className={`status-badge ${status}`}>
                  {status === "configured" ? "✅ Configured" : "❌ Not Configured"}
                </div>
              </div>

              {apiKey && (
                <div className="key-info">
                  <div className="key-details">
                    <strong>Key:</strong> {apiKey.keyPreview}
                    <br />
                    <strong>Last Used:</strong>{" "}
                    {apiKey.usage.lastUsed ? new Date(apiKey.usage.lastUsed).toLocaleDateString() : "Never"}
                    <br />
                    <strong>Usage:</strong> {apiKey.usage.totalRequests} requests
                  </div>
                </div>
              )}

              <div className="provider-actions">
                <button onClick={() => handleEdit(provider)} className="btn-edit">
                  {status === "configured" ? "Update" : "Configure"}
                </button>
                {status === "configured" && (
                  <button onClick={() => handleDelete(provider)} className="btn-delete">
                    Delete
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editingProvider && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Configure {providers[editingProvider]?.name}</h3>
              <button onClick={() => setEditingProvider(null)} className="btn-close">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>API Key *</label>
                <input
                  type="password"
                  value={formData.key}
                  onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                  placeholder={`Enter your ${providers[editingProvider]?.name} API key`}
                />
                <small>Format: {providers[editingProvider]?.keyFormat}</small>
              </div>

              <div className="form-group">
                <label>Key Name</label>
                <input
                  type="text"
                  value={formData.keyName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, keyName: e.target.value }))}
                  placeholder="Optional name for this key"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows="2"
                />
              </div>

              {testResults[editingProvider] && (
                <div className={`test-result ${testResults[editingProvider].success ? "success" : "error"}`}>
                  {testResults[editingProvider].testing ? (
                    <div className="testing">
                      <div className="spinner small"></div>
                      Testing API key...
                    </div>
                  ) : (
                    <div>
                      {testResults[editingProvider].success ? "✅" : "❌"} {testResults[editingProvider].message}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => handleTest(editingProvider, formData.key)}
                className="btn-test"
                disabled={!formData.key.trim() || testResults[editingProvider]?.testing}
              >
                {testResults[editingProvider]?.testing ? "Testing..." : "Test Key"}
              </button>
              <button onClick={() => setEditingProvider(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiKeyManager
