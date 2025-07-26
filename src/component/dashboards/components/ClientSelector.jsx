import { useState, useEffect } from "react"

const ClientSelector = ({ currentClient, onClientChange }) => {
  const [clientInfo, setClientInfo] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    settings: {
      defaultLanguage: "en",
      timezone: "UTC",
    },
  })

  useEffect(() => {
    if (currentClient) {
      fetchClientInfo()
    }
  }, [currentClient])

  const fetchClientInfo = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/client?clientId=${currentClient}`)
      const data = await response.json()
      if (data.success) {
        setClientInfo(data.data)
        setFormData({
          clientName: data.data.clientName,
          email: data.data.email,
          settings: data.data.settings || { defaultLanguage: "en", timezone: "UTC" },
        })
      }
    } catch (error) {
      console.error("Error fetching client info:", error)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/client?clientId=${currentClient}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (result.success) {
        setClientInfo(result.data)
        setIsEditing(false)
        alert("Client information updated successfully")
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error updating client:", error)
      alert("Failed to update client information")
    }
  }

  const handleClientIdChange = (newClientId) => {
    if (newClientId.trim()) {
      onClientChange(newClientId.trim())
    }
  }

  return (
    <div className="client-selector">
      <div className="client-header">
        <h3>Client Configuration</h3>
      </div>
      <div className="client-id-section">
        <div className="form-group">
          <label>Client ID</label>
          <div className="client-id-input">
            <input
              type="text"
              value={currentClient}
              onChange={(e) => handleClientIdChange(e.target.value)}
              placeholder="Enter client ID"
            />
            <span className="client-status">{clientInfo ? "✅ Active" : "⚠️ New"}</span>
          </div>
          <small>This identifies your organization/account</small>
        </div>
      </div>
      {clientInfo && (
        <div className="client-info">
          <div className="info-display">
            <div className="info-item">
              <strong>Name:</strong> {clientInfo.clientName}
            </div>
            <div className="info-item">
              <strong>Email:</strong> {clientInfo.email}
            </div>
            <div className="info-item">
              <strong>Status:</strong>
              <span className={`status-badge ${clientInfo.status}`}>{clientInfo.status}</span>
            </div>
            <div className="info-item">
              <strong>Plan:</strong> {clientInfo.subscription?.plan || "free"}
            </div>
            <div className="info-item">
              <strong>Default Language:</strong> {clientInfo.settings?.defaultLanguage || "en"}
            </div>
            <div className="info-item">
              <strong>Created:</strong> {new Date(clientInfo.createdAt).toLocaleDateString()}
            </div>
            <button onClick={() => setIsEditing(true)} className="btn-edit">
              Edit Information
            </button>
          </div>
        </div>
      )}
      {isEditing && (
        <div className="info-edit">
          <div className="form-group">
            <label>Client Name</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Default Language</label>
            <select
              value={formData.settings.defaultLanguage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, defaultLanguage: e.target.value },
                }))
              }
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
          <button onClick={handleSave} className="btn-save">
            Save
          </button>
          <button onClick={() => setIsEditing(false)} className="btn-cancel">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default ClientSelector 